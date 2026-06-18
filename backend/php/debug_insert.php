<?php
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = get_pdo();
    
    $name = "Debug Teacher";
    $email = "debug_" . time() . "@example.com";
    $password = "password123";
    $hashed = password_hash($password, PASSWORD_DEFAULT);
    
    $sql = 'INSERT INTO `Teachers` (`Full_Name`, `Email`, `Password`) VALUES (:name, :email, :pass)';
    $stmt = $pdo->prepare($sql);
    
    $stmt->execute([
        ':name'  => $name,
        ':email' => $email,
        ':pass'  => $hashed,
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Debug teacher inserted successfully',
        'email' => $email
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error_message' => $e->getMessage(),
        'error_code' => $e->getCode(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>
