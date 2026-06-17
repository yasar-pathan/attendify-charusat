<?php
require_once 'config.php';

echo "<h1>Attendance System Test</h1>";

try {
    $pdo = get_pdo();
    echo "<p style='color: green;'>✅ Database connection successful</p>";
    
    // Check if table exists
    $tableExists = $pdo->query("SHOW TABLES LIKE 'attendance_records'")->rowCount() > 0;
    
    if ($tableExists) {
        echo "<p style='color: green;'>✅ Table 'attendance_records' exists</p>";
        
        // Show table structure
        $structure = $pdo->query("DESCRIBE attendance_records")->fetchAll(PDO::FETCH_ASSOC);
        echo "<h3>Table Structure:</h3>";
        echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
        echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
        foreach ($structure as $column) {
            echo "<tr>";
            echo "<td>{$column['Field']}</td>";
            echo "<td>{$column['Type']}</td>";
            echo "<td>{$column['Null']}</td>";
            echo "<td>{$column['Key']}</td>";
            echo "<td>{$column['Default']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Check record count
        $count = $pdo->query("SELECT COUNT(*) as total FROM attendance_records")->fetch()['total'];
        echo "<p><strong>Total records in table:</strong> {$count}</p>";
        
        if ($count > 0) {
            // Show sample records
            echo "<h3>Sample Records:</h3>";
            $records = $pdo->query("SELECT * FROM attendance_records LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
            foreach ($records as $record) {
                echo "<div style='border: 1px solid #ccc; margin: 10px 0; padding: 10px;'>";
                echo "<strong>ID:</strong> {$record['id']}<br>";
                echo "<strong>Student:</strong> {$record['student_id']}<br>";
                echo "<strong>Subject:</strong> {$record['subject']}<br>";
                echo "<strong>Department:</strong> {$record['dept']}<br>";
                echo "<strong>Date:</strong> {$record['date']}<br>";
                echo "</div>";
            }
        } else {
            echo "<p style='color: orange;'>⚠️ No records found in the table</p>";
            echo "<p>This is normal if no students have marked attendance yet.</p>";
        }
        
    } else {
        echo "<p style='color: red;'>❌ Table 'attendance_records' does not exist!</p>";
        echo "<p>Please run <code>create_table.php</code> first to create the table.</p>";
    }
    
    // Test the view_class_attendance.php endpoint
    echo "<h3>Testing API Endpoint:</h3>";
    
    // Simulate a GET request
    $_GET = [
        'dept' => 'IT',
        'date' => date('Y-m-d')
    ];
    
    $_SERVER['REQUEST_METHOD'] = 'GET';
    
    // Capture output
    ob_start();
    include __DIR__ . '/view_class_attendance.php';
    $output = ob_get_clean();
    
    echo "<p><strong>API Response:</strong></p>";
    echo "<pre style='background: #f5f5f5; padding: 10px; border-radius: 5px; max-height: 300px; overflow-y: auto;'>";
    echo htmlspecialchars($output);
    echo "</pre>";
    
    // Parse the JSON response
    $response = json_decode($output, true);
    
    if ($response && $response['success']) {
        echo "<p style='color: green;'>✅ API working correctly!</p>";
        echo "<p><strong>Records found:</strong> {$response['total_records']}</p>";
    } else {
        echo "<p style='color: red;'>❌ API response error</p>";
        if (isset($response['error'])) {
            echo "<p><strong>Error:</strong> {$response['error']}</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}

echo "<h3>Next Steps:</h3>";
echo "<ol>";
echo "<li>Make sure the attendance table exists (run create_table.php if needed)</li>";
echo "<li>Students need to mark attendance to see records</li>";
echo "<li>Use the Get Attendance module with proper filters</li>";
echo "<li>Check browser console for any JavaScript errors</li>";
echo "</ol>";
?>


