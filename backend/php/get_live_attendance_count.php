<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond_json(405, ['success' => false, 'error' => 'Method not allowed']);
}

// Get query parameters
$subject = trim((string)($_GET['subject'] ?? ''));
$dept = trim((string)($_GET['dept'] ?? ''));
$division = trim((string)($_GET['division'] ?? ''));
$date = trim((string)($_GET['date'] ?? date('Y-m-d')));
$lectureType = trim((string)($_GET['lectureType'] ?? ''));
$timeSlot = trim((string)($_GET['timeSlot'] ?? ''));
// Optional semester filter for accurate counts
$sem = trim((string)($_GET['sem'] ?? ''));

// At least subject and date are required
if ($subject === '' || $date === '') {
    respond_json(400, ['success' => false, 'error' => 'Subject and date are required']);
}

try {
    $pdo = get_pdo();
    
    // Build the query to count students who have marked attendance
    $whereConditions = [];
    $params = [];
    
    if ($subject !== '') {
        $whereConditions[] = 'subject = :subject';
        $params[':subject'] = $subject;
    }
    
    if ($dept !== '') {
        $whereConditions[] = 'dept = :dept';
        $params[':dept'] = strtoupper($dept);
    }
    
    if ($division !== '') {
        $whereConditions[] = 'division = :division';
        $params[':division'] = $division;
    }

    if ($sem !== '') {
        $whereConditions[] = 'sem = :sem';
        $params[':sem'] = (int)$sem;
    }
    
    if ($date !== '') {
        $whereConditions[] = 'date = :date';
        $params[':date'] = $date;
    }
    
    if ($lectureType !== '') {
        $whereConditions[] = 'MOT = :lecture_type';
        $params[':lecture_type'] = strtolower($lectureType);
    }
    
    if ($timeSlot !== '') {
        $whereConditions[] = 'timeslot = :time_slot';
        $params[':time_slot'] = $timeSlot;
    }
    
    $whereClause = '';
    if (!empty($whereConditions)) {
        $whereClause = 'WHERE ' . implode(' AND ', $whereConditions);
    }
    
    // Get total count of students who marked attendance
    $countSql = "SELECT 
                    COUNT(*) as total_present,
                    COUNT(DISTINCT student_id) as unique_students,
                    COUNT(DISTINCT subject) as total_subjects
                  FROM `attendance_records` 
                  {$whereClause}";
    
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $countResult = $countStmt->fetch();
    
    // Get recent attendance records (last 10)
    $recentSql = "SELECT 
                     student_id,
                     gmail,
                     selfie,
                     attendance_time,
                     MOT,
                     timeslot
                   FROM `attendance_records` 
                   {$whereClause}
                   ORDER BY attendance_time DESC
                   LIMIT 10";
    
    $recentStmt = $pdo->prepare($recentSql);
    $recentStmt->execute($params);
    $recentRecords = $recentStmt->fetchAll();
    
    // Compute total eligible students for this session (department/division/semester)
    $totalEligible = null;
    if ($dept !== '' && $division !== '' && $sem !== '') {
        // Normalize division similarly to submission matching: prefer numeric part
        $normalizeDivision = function($value) {
            $v = trim((string)$value);
            $digits = preg_replace('/[^0-9]/', '', $v);
            if ($digits !== '') {
                return ltrim($digits, '0');
            }
            return strtoupper(preg_replace('/\s+/', '', $v));
        };
        $normalizedDivision = $normalizeDivision($division);

        $eligibleSql = "SELECT COUNT(*) AS total_eligible
                         FROM students
                         WHERE department = :dept_elig
                           AND semester = :sem_elig
                           AND is_active = 1
                           AND (
                                division = :div_elig
                                OR REPLACE(UPPER(division), ' ', '') = :div_text_elig
                           )";
        $eligibleStmt = $pdo->prepare($eligibleSql);
        $eligibleStmt->execute([
            ':dept_elig' => strtoupper($dept),
            ':sem_elig' => (int)$sem,
            ':div_elig' => $normalizedDivision,
            ':div_text_elig' => $normalizedDivision
        ]);
        $eligibleRow = $eligibleStmt->fetch();
        $totalEligible = (int)($eligibleRow['total_eligible'] ?? 0);
    }

    // Get department-wise breakdown if department is specified
    $deptBreakdown = null;
    if ($dept === '') {
        $deptBreakdownSql = "SELECT 
                               dept,
                               COUNT(*) as count
                             FROM `attendance_records` 
                             {$whereClause}
                             GROUP BY dept
                             ORDER BY count DESC";
        
        $deptBreakdownStmt = $pdo->prepare($deptBreakdownSql);
        $deptBreakdownStmt->execute($params);
        $deptBreakdown = $deptBreakdownStmt->fetchAll();
    }
    
    respond_json(200, [
        'success' => true,
        'attendance_summary' => [
            'total_present' => (int)$countResult['total_present'],
            'unique_students' => (int)$countResult['unique_students'],
            'total_subjects' => (int)$countResult['total_subjects'],
            'total_eligible' => $totalEligible,
            'remaining' => $totalEligible !== null ? max(0, $totalEligible - (int)$countResult['unique_students']) : null,
            'date' => $date,
            'subject' => $subject,
            'department' => $dept,
            'division' => $division,
            'semester' => $sem,
            'lecture_type' => $lectureType,
            'time_slot' => $timeSlot
        ],
        'recent_attendance' => $recentRecords,
        'department_breakdown' => $deptBreakdown,
        'last_updated' => date('Y-m-d H:i:s'),
        'filters_applied' => [
            'subject' => $subject,
            'dept' => $dept,
            'division' => $division,
            'date' => $date,
            'lectureType' => $lectureType,
            'timeSlot' => $timeSlot
        ]
    ]);
    
} catch (Throwable $e) {
    respond_json(500, ['success' => false, 'error' => 'Failed to fetch attendance count: ' . $e->getMessage()]);
}
?>


