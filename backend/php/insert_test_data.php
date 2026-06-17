<?php
require_once 'config.php';

echo "<h1>Insert Test Attendance Data</h1>";

try {
    $pdo = get_pdo();
    
    // Check if table exists
    $tableExists = $pdo->query("SHOW TABLES LIKE 'attendance_records'")->rowCount() > 0;
    
    if (!$tableExists) {
        echo "<p style='color: red;'>❌ Table 'attendance_records' does not exist!</p>";
        echo "<p>Please run <code>create_table.php</code> first.</p>";
        exit;
    }
    
    echo "<p style='color: green;'>✅ Table exists</p>";
    
    // Insert test data
    $testData = [
        [
            'MOT' => 'lecture',
            'timeslot' => '9:10 to 10:10',
            'dept' => 'IT',
            'division' => 'IT 1',
            'subject' => 'Web Development',
            'faculty_name' => 'Dr. Test Teacher',
            'sem' => 5,
            'date' => date('Y-m-d'),
            'student_id' => 'IT001',
            'selfie' => 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
            'gmail' => 'test1@charusat.edu.in'
        ],
        [
            'MOT' => 'lecture',
            'timeslot' => '9:10 to 10:10',
            'dept' => 'IT',
            'division' => 'IT 1',
            'subject' => 'Web Development',
            'faculty_name' => 'Dr. Test Teacher',
            'sem' => 5,
            'date' => date('Y-m-d'),
            'student_id' => 'IT002',
            'selfie' => 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
            'gmail' => 'test2@charusat.edu.in'
        ],
        [
            'MOT' => 'lecture',
            'timeslot' => '9:10 to 10:10',
            'dept' => 'IT',
            'division' => 'IT 1',
            'subject' => 'Web Development',
            'faculty_name' => 'Dr. Test Teacher',
            'sem' => 5,
            'date' => date('Y-m-d'),
            'student_id' => 'IT003',
            'selfie' => 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
            'gmail' => 'test3@charusat.edu.in'
        ]
    ];
    
    $insertSql = "INSERT INTO `attendance_records` (
        `MOT`, `timeslot`, `dept`, `division`, `subject`, `faculty_name`, 
        `sem`, `date`, `student_id`, `selfie`, `gmail`
    ) VALUES (
        :MOT, :timeslot, :dept, :division, :subject, :faculty_name,
        :sem, :date, :student_id, :selfie, :gmail
    )";
    
    $stmt = $pdo->prepare($insertSql);
    $insertedCount = 0;
    
    foreach ($testData as $data) {
        try {
            $stmt->execute($data);
            $insertedCount++;
            echo "<p>✅ Inserted test record for {$data['student_id']}</p>";
        } catch (Exception $e) {
            echo "<p>⚠️ Could not insert test record: " . $e->getMessage() . "</p>";
        }
    }
    
    echo "<p style='color: green;'>✅ Successfully inserted {$insertedCount} test records</p>";
    
    // Verify the data was inserted
    $count = $pdo->query("SELECT COUNT(*) as total FROM attendance_records")->fetch()['total'];
    echo "<p><strong>Total records now in table:</strong> {$count}</p>";
    
    echo "<h3>Test Data Summary:</h3>";
    echo "<ul>";
    echo "<li><strong>Department:</strong> IT</li>";
    echo "<li><strong>Division:</strong> IT 1</li>";
    echo "<li><strong>Subject:</strong> Web Development</li>";
    echo "<li><strong>Date:</strong> " . date('Y-m-d') . "</li>";
    echo "<li><strong>Time Slot:</strong> 9:10 to 10:10</li>";
    echo "<li><strong>Semester:</strong> 5</li>";
    echo "</ul>";
    
    echo "<h3>Next Steps:</h3>";
    echo "<ol>";
    echo "<li>Go to the Get Attendance module</li>";
    echo "<li>Set Department to 'IT'</li>";
    echo "<li>Set Date to today's date</li>";
    echo "<li>Click 'Fetch Records'</li>";
    echo "<li>You should now see 3 test records</li>";
    echo "</ol>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}
?>


