<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

// Override CORS for this GET endpoint
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = get_pdo();
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM Teachers");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    respond_json(200, [
        'success' => true,
        'count' => (int)$result['total']
    ]);
    
} catch(Throwable $e) {
    respond_json(500, [
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
