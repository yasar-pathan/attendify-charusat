// Google OAuth Configuration
// Replace these values with your actual Google OAuth credentials

export const GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  SCOPE: "email profile",
  USER_INFO_URL: "https://www.googleapis.com/oauth2/v2/userinfo"
};

// Instructions to get Google OAuth credentials:
// 1. Go to Google Cloud Console (https://console.cloud.google.com/)
// 2. Create a new project or select existing one
// 3. Enable Google+ API and Google OAuth2 API
// 4. Go to Credentials > Create Credentials > OAuth 2.0 Client IDs
// 5. Set application type to "Web application"
// 6. Add authorized redirect URIs:
//    - http://localhost:8080/oauth-callback (for development)
//    - https://yourdomain.com/oauth-callback (for production)
// 7. Copy the Client ID and Client Secret
// 8. Update the .env file with your actual credentials
