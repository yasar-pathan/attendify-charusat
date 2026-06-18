<?php
// Health check endpoint for AWS Elastic Beanstalk Load Balancer
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

echo json_encode([
    'status' => 'healthy',
    'message' => 'Attendify Backend API is running.',
    'timestamp' => date('Y-m-d H:i:s')
]);
