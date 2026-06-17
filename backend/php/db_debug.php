<?php
// Database diagnostic script
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$host = getenv('RDS_HOSTNAME') ?: '127.0.0.1';
$username = getenv('RDS_USERNAME') ?: 'root';
$password = getenv('RDS_PASSWORD') ?: 'root123';
$dbname = getenv('RDS_DB_NAME') ?: 'attendify';

$diagnostics = [
    'env_host' => $host,
    'env_username' => $username,
    'env_database' => $dbname,
    'has_password' => !empty($password),
    'php_version' => PHP_VERSION,
    'mysql_extension_loaded' => extension_loaded('pdo_mysql'),
];

// Test 1: Connect to MySQL server without selecting database (tests connection + credentials)
try {
    $dsnNoDb = "mysql:host=$host;charset=utf8mb4";
    $pdoNoDb = new PDO($dsnNoDb, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5 // 5 seconds timeout
    ]);
    $diagnostics['connection_to_mysql_server'] = 'SUCCESS';
    
    // Test 2: List available databases
    $stmt = $pdoNoDb->query("SHOW DATABASES");
    $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $diagnostics['available_databases'] = $databases;
    
    $diagnostics['target_database_exists'] = in_array($dbname, $databases, true);
    
    // Test 3: Connect directly to the database
    if ($diagnostics['target_database_exists']) {
        try {
            $dsnWithDb = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
            $pdoWithDb = new PDO($dsnWithDb, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            $diagnostics['connection_to_target_db'] = 'SUCCESS';
        } catch (Throwable $dbErr) {
            $diagnostics['connection_to_target_db'] = 'FAILED: ' . $dbErr->getMessage();
        }
    } else {
        $diagnostics['connection_to_target_db'] = 'SKIPPED: Target database does not exist';
    }
    
} catch (Throwable $e) {
    $diagnostics['connection_to_mysql_server'] = 'FAILED: ' . $e->getMessage();
    $diagnostics['possible_reasons'] = [
        'If timeout: Security group inbound rules are blocking the EC2 backend from connecting to the RDS database.',
        'If Access Denied: The master username or password in Beanstalk environment variables does not match RDS settings.'
    ];
}

echo json_encode($diagnostics, JSON_PRETTY_PRINT);
