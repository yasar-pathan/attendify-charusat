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
        // Automatically check and initialize tables if they don't exist
        initialize_tables_if_needed($pdo);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
        exit;
    }

    return $pdo;
}

function initialize_tables_if_needed(PDO $pdo): void
{
    // 1. Create Teachers table if it doesn't exist
    $stmt = $pdo->query("SHOW TABLES LIKE 'Teachers'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `Teachers` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `Full_Name` varchar(100) NOT NULL,
            `Email` varchar(100) NOT NULL UNIQUE,
            `Password` varchar(255) NOT NULL,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `unique_email` (`Email`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

    // 2. Create students table if it doesn't exist
    $stmt = $pdo->query("SHOW TABLES LIKE 'students'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `students` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `student_id` varchar(20) NOT NULL UNIQUE,
            `name` varchar(100) NOT NULL,
            `email` varchar(100) NOT NULL UNIQUE,
            `department` enum('IT', 'CSE', 'CE') NOT NULL,
            `division` varchar(10) NOT NULL,
            `semester` int(2) NOT NULL,
            `is_active` boolean DEFAULT TRUE,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `unique_student_id` (`student_id`),
            UNIQUE KEY `unique_email` (`email`),
            KEY `idx_department` (`department`),
            KEY `idx_semester` (`semester`),
            KEY `idx_active` (`is_active`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

    // 3. Create attendance_records table if it doesn't exist
    $stmt = $pdo->query("SHOW TABLES LIKE 'attendance_records'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `attendance_records` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `MOT` varchar(20) NOT NULL,
            `timeslot` varchar(50) NOT NULL,
            `dept` varchar(10) NOT NULL,
            `division` varchar(20) NOT NULL,
            `subject` varchar(100) NOT NULL,
            `faculty_name` varchar(100) NOT NULL,
            `sem` int(2) NOT NULL,
            `date` date NOT NULL,
            `student_id` varchar(20) NOT NULL,
            `selfie` longtext NOT NULL,
            `gmail` varchar(100) NOT NULL,
            `attendance_time` timestamp DEFAULT CURRENT_TIMESTAMP,
            `latitude` decimal(10,8) DEFAULT NULL,
            `longitude` decimal(11,8) DEFAULT NULL,
            `accuracy` decimal(10,2) DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_student_date` (`student_id`, `date`),
            KEY `idx_dept_sem` (`dept`, `sem`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } else {
        // Table exists, check for missing columns and add them dynamically
        $existingColumns = [];
        $columnsStmt = $pdo->query("SHOW COLUMNS FROM `attendance_records`");
        while ($row = $columnsStmt->fetch(PDO::FETCH_ASSOC)) {
            $existingColumns[] = strtolower($row['Field']);
        }
        
        if (!in_array('attendance_time', $existingColumns, true)) {
            $pdo->exec("ALTER TABLE `attendance_records` ADD COLUMN `attendance_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        }
        if (!in_array('latitude', $existingColumns, true)) {
            $pdo->exec("ALTER TABLE `attendance_records` ADD COLUMN `latitude` DECIMAL(10,8) DEFAULT NULL");
        }
        if (!in_array('longitude', $existingColumns, true)) {
            $pdo->exec("ALTER TABLE `attendance_records` ADD COLUMN `longitude` DECIMAL(11,8) DEFAULT NULL");
        }
        if (!in_array('accuracy', $existingColumns, true)) {
            $pdo->exec("ALTER TABLE `attendance_records` ADD COLUMN `accuracy` DECIMAL(10,2) DEFAULT NULL");
        }
    }
}

function respond_json(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}


