<?php
// Helper script to create database
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$host = getenv('RDS_HOSTNAME') ?: '127.0.0.1';
$username = getenv('RDS_USERNAME') ?: 'root';
$password = getenv('RDS_PASSWORD') ?: 'root123';
$dbname = getenv('RDS_DB_NAME') ?: 'attendify';

try {
    $dsnNoDb = "mysql:host=$host;charset=utf8mb4";
    $pdo = new PDO($dsnNoDb, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    echo json_encode([
        'success' => true,
        'message' => "Database '$dbname' created successfully or already exists."
    ]);
    
} catch (Throwable $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Failed to create database: ' . $e->getMessage()
    ]);
}
