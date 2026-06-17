<?php
require_once 'config.php';

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond_json(405, ['success' => false, 'error' => 'Method not allowed']);
}

try {
    // Get database connection
    $pdo = get_pdo();
    
    $input = file_get_contents('php://input');
    $payload = json_decode($input, true);
    
    if (!$payload) {
        respond_json(400, ['success' => false, 'error' => 'Invalid JSON payload']);
    }
    
    // Extract data from payload
    $mot = trim((string)($payload['MOT'] ?? ''));
    $timeslot = trim((string)($payload['timeslot'] ?? ''));
    $dept = trim((string)($payload['dept'] ?? ''));
    $division = trim((string)($payload['division'] ?? ''));
    $subject = trim((string)($payload['subject'] ?? ''));
    $faculty_name = trim((string)($payload['faculty_name'] ?? ''));
    $sem = (int)($payload['sem'] ?? 0);
    $date = trim((string)($payload['date'] ?? ''));
    $student_id = trim((string)($payload['student_id'] ?? ''));
    $selfie = trim((string)($payload['selfie'] ?? ''));

    $gmail = trim((string)($payload['gmail'] ?? ''));
    $latitude = isset($payload['latitude']) ? (float)$payload['latitude'] : null;
    $longitude = isset($payload['longitude']) ? (float)$payload['longitude'] : null;
    $accuracy = isset($payload['accuracy']) ? (float)$payload['accuracy'] : null;
    
    // Validate required fields
    if ($mot === '' || $timeslot === '' || $dept === '' || $division === '' || 
        $subject === '' || $faculty_name === '' || $sem === 0 || $date === '' || 
        $student_id === '' || $selfie === '' || $gmail === '') {
        respond_json(400, ['success' => false, 'error' => 'All fields are required']);
    }
    
    // Validate department
    if (!in_array($dept, ['IT', 'CSE', 'CE'])) {
        respond_json(400, ['success' => false, 'error' => 'Invalid department']);
    }
    
    // Validate MOT
    if (!in_array($mot, ['lab', 'lecture'])) {
        respond_json(400, ['success' => false, 'error' => 'Invalid mode of teaching']);
    }
    
    // Validate semester
    if ($sem < 1 || $sem > 8) {
        respond_json(400, ['success' => false, 'error' => 'Invalid semester']);
    }
    
    // Validate date format
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        respond_json(400, ['success' => false, 'error' => 'Invalid date format']);
    }
    
    // Validate email format
    if (!filter_var($gmail, FILTER_VALIDATE_EMAIL)) {
        respond_json(400, ['success' => false, 'error' => 'Invalid email format']);
    }
    
    // Ensure student exists and is active in `students` table
    $studentStmt = $pdo->prepare('SELECT student_id, department, division, semester, is_active FROM students WHERE student_id = :sid LIMIT 1');
    $studentStmt->execute([':sid' => $student_id]);
    $studentRow = $studentStmt->fetch(PDO::FETCH_ASSOC);
    if (!$studentRow) {
        respond_json(403, ['success' => false, 'error' => 'Student is not registered. Contact admin.']);
    }
    if (!(bool)$studentRow['is_active']) {
        respond_json(403, ['success' => false, 'error' => 'Student is inactive. Contact admin.']);
    }

    // Enforce student belongs to the requested session (department, division, semester)
    $studentDepartment = strtoupper((string)$studentRow['department']);
    $studentDivision = (string)$studentRow['division'];
    $studentSemester = (int)$studentRow['semester'];
    
    // Normalize division comparison to allow values like "IT 2" vs "2"
    $normalizeDivision = function($value) {
        $v = trim((string)$value);
        // Prefer numeric division if present
        $digits = preg_replace('/[^0-9]/', '', $v);
        if ($digits !== '') {
            return ltrim($digits, '0');
        }
        // Fallback to uppercased, spaceless text
        return strtoupper(preg_replace('/\s+/', '', $v));
    };
    
    $sessionDivisionNorm = $normalizeDivision($division);
    $studentDivisionNorm = $normalizeDivision($studentDivision);

    if ($studentDepartment !== strtoupper($dept) || $studentDivisionNorm !== $sessionDivisionNorm || $studentSemester !== (int)$sem) {
        respond_json(403, [
            'success' => false,
            'error' => 'Student is not eligible for this session (department/division/semester mismatch)'
        ]);
    }

    // Prevent duplicate attendance for the same session by the same student
    $dupCheckSql = 'SELECT 1 FROM `attendance_records`
                    WHERE student_id = :student_id
                      AND date = :date
                      AND dept = :dept
                      AND division = :division
                      AND sem = :sem
                      AND timeslot = :timeslot
                      AND MOT = :mot
                      AND subject = :subject
                    LIMIT 1';
    $dupStmt = $pdo->prepare($dupCheckSql);
    $dupStmt->execute([
        ':student_id' => $student_id,
        ':date' => $date,
        ':dept' => $dept,
        ':division' => $division,
        ':sem' => (int)$sem,
        ':timeslot' => $timeslot,
        ':mot' => $mot,
        ':subject' => $subject,
    ]);
    if ($dupStmt->fetchColumn()) {
        respond_json(409, [
            'success' => false,
            'error' => 'Attendance already recorded for this session'
        ]);
    }

    // Insert into database
    $sql = 'INSERT INTO `attendance_records` (`MOT`, `timeslot`, `dept`, `division`, `subject`, `faculty_name`, `sem`, `date`, `student_id`, `selfie`, `gmail`, `latitude`, `longitude`, `accuracy`) VALUES (:mot, :timeslot, :dept, :division, :subject, :faculty_name, :sem, :date, :student_id, :selfie, :gmail, :latitude, :longitude, :accuracy)';

    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        ':mot' => $mot,
        ':timeslot' => $timeslot,
        ':dept' => $dept,
        ':division' => $division,
        ':subject' => $subject,
        ':faculty_name' => $faculty_name,
        ':sem' => $sem,
        ':date' => $date,
        ':student_id' => $student_id,
        ':selfie' => $selfie,
        ':gmail' => $gmail,
        ':latitude' => $latitude,
        ':longitude' => $longitude,
        ':accuracy' => $accuracy
    ]);
    
    if ($result) {
        $attendance_id = $pdo->lastInsertId();
        error_log("✓ Attendance inserted successfully. ID: $attendance_id, Student: $student_id, Date: $date, Dept: $dept");
        respond_json(201, [
            'success' => true, 
            'message' => 'Attendance recorded successfully',
            'attendance_id' => $attendance_id
        ]);
    } else {
        $errorInfo = $stmt->errorInfo();
        $errorMsg = "SQL Error: " . implode(" | ", $errorInfo);
        error_log("✗ Attendance insertion FAILED: $errorMsg | Attempted insert: MOT=$mot, timeslot=$timeslot, dept=$dept, division=$division, student=$student_id");
        respond_json(500, ['success' => false, 'error' => 'Failed to record attendance', 'debug' => $errorMsg]);
    }
    
} catch (PDOException $e) {
    respond_json(500, ['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    respond_json(500, ['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>
