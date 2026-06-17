<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond_json(405, ['success' => false, 'error' => 'Method not allowed']);
}

// Get query parameters
$dept = trim((string)($_GET['dept'] ?? ''));
$date = trim((string)($_GET['date'] ?? date('Y-m-d')));
$division = trim((string)($_GET['division'] ?? ''));
$timeSlot = trim((string)($_GET['timeSlot'] ?? ''));
$sem = trim((string)($_GET['sem'] ?? ''));
$subject = trim((string)($_GET['subject'] ?? ''));

// At least department and date are required
if ($dept === '' || $date === '') {
    respond_json(400, ['success' => false, 'error' => 'Department and date are required']);
}

if (!in_array(strtoupper($dept), ['IT', 'CSE', 'CE'])) {
    respond_json(400, ['success' => false, 'error' => 'Invalid department. Must be IT, CSE, or CE']);
}

try {
    $pdo = get_pdo();
    
    // Build the query to get attendance records
    $whereConditions = [];
    $params = [];
    
    if ($dept !== '') {
        $whereConditions[] = 'dept = :dept';
        $params[':dept'] = strtoupper($dept);
    }
    
    if ($date !== '') {
        $whereConditions[] = 'date = :date';
        $params[':date'] = $date;
    }
    
    if ($division !== '') {
        $whereConditions[] = 'division = :division';
        $params[':division'] = $division;
    }
    
    if ($timeSlot !== '') {
        $whereConditions[] = 'timeslot = :timeSlot';
        $params[':timeSlot'] = $timeSlot;
    }
    
    if ($sem !== '') {
        $whereConditions[] = 'sem = :sem';
        $params[':sem'] = (int)$sem;
    }
    
    if ($subject !== '') {
        $whereConditions[] = 'subject LIKE :subject';
        $params[':subject'] = '%' . $subject . '%';
    }
    
    $whereClause = '';
    if (!empty($whereConditions)) {
        $whereClause = 'WHERE ' . implode(' AND ', $whereConditions);
    }
    
    // Get attendance records
    $sql = "SELECT 
                id as ID,
                student_id,
                gmail,
                selfie,
                attendance_time,
                subject,
                dept,
                division,
                MOT,
                timeslot,
                sem,
                date,
                faculty_name
              FROM `attendance_records` 
              {$whereClause} 
              ORDER BY attendance_time DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get summary statistics
    $summarySql = "SELECT 
                     COUNT(*) as total_students,
                     COUNT(DISTINCT student_id) as unique_students,
                     COUNT(DISTINCT subject) as total_subjects
                   FROM `attendance_records` 
                   {$whereClause}";
    
    $summaryStmt = $pdo->prepare($summarySql);
    $summaryStmt->execute($params);
    $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get department-wise breakdown
    $deptSummarySql = "SELECT 
                         dept,
                         COUNT(*) as count
                       FROM `attendance_records` 
                       {$whereClause}
                       GROUP BY dept 
                       ORDER BY count DESC";
    
    $deptSummaryStmt = $pdo->prepare($deptSummarySql);
    $deptSummaryStmt->execute($params);
    $deptSummary = $deptSummaryStmt->fetchAll(PDO::FETCH_ASSOC);
    
    respond_json(200, [
        'success' => true,
        'department' => $dept,
        'summary' => [
            'total_students' => (int)$summary['total_students'],
            'unique_students' => (int)$summary['unique_students'],
            'total_subjects' => (int)$summary['total_subjects']
        ],
        'department_summary' => $deptSummary,
        'records' => $records,
        'total_records' => count($records),
        'filters_applied' => [
            'dept' => $dept,
            'date' => $date,
            'division' => $division,
            'timeSlot' => $timeSlot,
            'sem' => $sem,
            'subject' => $subject
        ]
    ]);
    
} catch (Throwable $e) {
    respond_json(500, ['success' => false, 'error' => 'Failed to fetch attendance records: ' . $e->getMessage()]);
}
?>


