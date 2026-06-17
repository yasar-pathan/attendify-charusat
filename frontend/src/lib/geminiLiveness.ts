// Lightweight Gemini liveness analysis helper
// Uses Vite env var VITE_GEMINI_API_KEY. If missing or Gemini fails,
// a fast local heuristic runs on the single frame and returns a best-effort score.

const FALLBACK_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || null;

export type LivenessResult = {
  isLive: boolean;
  score: number; // 0..1 inferred confidence
  reason?: string;
};

function getGeminiApiKey(): string | null {
  return FALLBACK_KEY || null;
}

// Convert dataURL (image/jpeg or image/png) to base64 without prefix
function stripDataUrlPrefix(dataUrl: string): { mime: string; base64: string } {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) {
    throw new Error("Invalid data URL for image");
  }
  return { mime: match[1], base64: match[2] };
}

// Local heuristic: compute a simple "sharpness/textureness" score by sampling
// the image on a small canvas and measuring local gradients. This is NOT a
// replacement for a video-based liveness detector but helps when Gemini isn't
// available (e.g., dev or offline) to trigger captures on likely live faces.
async function localHeuristicScore(dataUrl: string): Promise<{ score: number; reason?: string }> {
  return new Promise(async (resolve) => {
    try {
      // Convert dataURL to a Blob without going through the network
      const parts = dataUrl.split(",");
      if (parts.length < 2) return resolve({ score: 0, reason: "invalid-dataurl" });
      const meta = parts[0];
      const b64 = parts[1];
      const mimeMatch = meta.match(/data:(.*?);base64/);
      const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const binary = atob(b64);
      const len = binary.length;
      const u8 = new Uint8Array(len);
      for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
      const blob = new Blob([u8], { type: mime });

      // createImageBitmap avoids creating network entries and is fast
      const imgBitmap = await createImageBitmap(blob);

      // draw bitmap into a small canvas
      const w = 160;
      const h = Math.max(120, Math.round((imgBitmap.height / imgBitmap.width) * w));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve({ score: 0, reason: "Canvas unavailable" });
      ctx.drawImage(imgBitmap, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // Compute simple gradient magnitude sum (approx laplacian) as texture measure
      let gradSum = 0;
      let count = 0;
      for (let y = 1; y < h - 1; y += 2) {
        for (let x = 1; x < w - 1; x += 2) {
          const i = (y * w + x) * 4;
          const iL = (y * w + (x - 1)) * 4;
          const iR = (y * w + (x + 1)) * 4;
          const iU = ((y - 1) * w + x) * 4;
          const iD = ((y + 1) * w + x) * 4;

          const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const lumL = (data[iL] + data[iL + 1] + data[iL + 2]) / 3;
          const lumR = (data[iR] + data[iR + 1] + data[iR + 2]) / 3;
          const lumU = (data[iU] + data[iU + 1] + data[iU + 2]) / 3;
          const lumD = (data[iD] + data[iD + 1] + data[iD + 2]) / 3;

          const gx = Math.abs(lumR - lumL);
          const gy = Math.abs(lumD - lumU);
          gradSum += Math.sqrt(gx * gx + gy * gy);
          count++;
        }
      }

      const avgGrad = gradSum / Math.max(1, count);
      // Normalize to 0..1 using empirical scaling
      const normalized = Math.max(0, Math.min(1, (avgGrad - 2) / 18));
      resolve({ score: Number(normalized.toFixed(3)), reason: "local-heuristic" });
    } catch (e) {
      resolve({ score: 0, reason: String(e) });
    }
  });
}

// Calls Gemini 1.5 Flash via REST API for an image-only prompt.
// NOTE: True liveness requires video. Single-frame liveness is probabilistic.
export async function analyzeLiveness(
  imageDataUrl: string,
  opts?: { threshold?: number; signal?: AbortSignal }
): Promise<LivenessResult> {
  const apiKey = getGeminiApiKey();
  const threshold = opts?.threshold ?? 0.55;

  const { mime, base64 } = (() => {
    try {
      return stripDataUrlPrefix(imageDataUrl);
    } catch (e) {
      return { mime: "image/jpeg", base64: "" };
    }
  })();

  // If we have an API key, try Gemini first; otherwise run local heuristic.
  if (!apiKey) {
    const local = await localHeuristicScore(imageDataUrl);
    const isLive = local.score >= threshold;
    console.debug("geminiLiveness: no API key, local heuristic ->", local);
    return { isLive, score: local.score, reason: local.reason };
  }

  const textPrompt = [
    "Decide if this face image likely comes from a LIVE person, not a screen or photo.",
    "Use cues: skin texture, 3D shading, defocus/DOF, moire/pixel grid, reflections, flatness, unnatural edges, lighting.",
    "Return a single JSON object with fields: isLive (boolean), score (0..1), reason (short).",
  ].join(" ");

  const body = {
    contents: [
      {
        parts: [
          { text: textPrompt },
          { inline_data: { mime_type: mime, data: base64 } },
        ],
      },
    ],
  } as const;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: opts?.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("geminiLiveness: Gemini HTTP error", res.status, text);
      // Fall back to local heuristic on HTTP failure
      const local = await localHeuristicScore(imageDataUrl);
      const isLiveLocal = local.score >= threshold;
      return { isLive: isLiveLocal, score: local.score, reason: `gemini-http-${res.status}` };
    }

    const json = await res.json();
    const textOut: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOut) {
      console.warn("geminiLiveness: empty response from Gemini", json);
      const local = await localHeuristicScore(imageDataUrl);
      return { isLive: local.score >= threshold, score: local.score, reason: "empty-gemini-response" };
    }

    const match = textOut.match(/\{[\s\S]*\}/);
    if (!match) {
      console.warn("geminiLiveness: unparsable Gemini text, falling back to heuristic", textOut);
      const local = await localHeuristicScore(imageDataUrl);
      return { isLive: local.score >= threshold, score: local.score, reason: "unparsable-gemini" };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(match[0]);
    } catch (e) {
      console.warn("geminiLiveness: invalid JSON from Gemini, falling back", e);
      const local = await localHeuristicScore(imageDataUrl);
      return { isLive: local.score >= threshold, score: local.score, reason: "invalid-json-gemini" };
    }

    const score = Math.max(0, Math.min(1, Number(parsed.score ?? 0)));
    const isLive = Boolean(parsed.isLive) && score >= threshold;
    return { isLive, score, reason: parsed.reason };
  } catch (err: any) {
    console.warn("geminiLiveness: network/exception", err);
    const local = await localHeuristicScore(imageDataUrl);
    return { isLive: local.score >= threshold, score: local.score, reason: `exception-fallback:${local.reason}` };
  }
}
