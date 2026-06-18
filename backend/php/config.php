<?php
// Database configuration for AWS Elastic Beanstalk / RDS
// Adjust these values to match your MySQL setup

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// CORS (adjust origin/port to match Vite dev server)
$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://presentsir.tech',
    'https://www.presentsir.tech',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$isAmplify = str_ends_with($origin, '.amplifyapp.com');

if (in_array($origin, $allowedOrigins, true) || $isAmplify) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

define('DB_HOST', getenv('RDS_HOSTNAME') ?: '127.0.0.1');
define('DB_NAME', getenv('RDS_DB_NAME') ?: 'attendify');
define('DB_USER', getenv('RDS_USERNAME') ?: 'root');
define('DB_PASS', getenv('RDS_PASSWORD') ?: 'root123');

function get_pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database connection failed']);
        exit;
    }

    return $pdo;
}

function respond_json(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}


