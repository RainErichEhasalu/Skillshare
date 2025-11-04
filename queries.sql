-- 1. Leia kõik kursused koos õpetajate nimedega
-- See päring annab ülevaate, millised kursused on saadaval ja kes neid õpetab.
SELECT 
    c.title AS course_title,
    u.name AS teacher_name
FROM courses c
JOIN users u ON c.teacher_id = u.id
ORDER BY c.title;

-- 2. Leia kõik õpilased, kes on registreerunud rohkem kui 5 kursusele
-- See päring aitab tuvastada aktiivseid õpilasi, kes osalevad mitmesugustes kursustes.
SELECT 
    u.name AS student_name,
    COUNT(uc.course_id) AS total_courses
FROM users u
JOIN user_courses uc ON u.id = uc.user_id
WHERE u.role = 'student'
GROUP BY u.id
HAVING total_courses > 5
ORDER BY total_courses DESC;

-- 3. Leia kursuste keskmine hinnang
-- See päring annab ülevaate, kui hästi kursused on hinnatud.
SELECT 
    c.title AS course_title,
    AVG(r.rating) AS average_rating
FROM courses c
LEFT JOIN reviews r ON c.id = r.course_id
GROUP BY c.id
HAVING average_rating IS NOT NULL
ORDER BY average_rating DESC;

-- 4. Leia kõik kursused, millel on vähemalt 10 arvustust
-- See päring aitab leida populaarseid kursusi, mis on saanud palju tagasisidet.
SELECT 
    c.title AS course_title,
    COUNT(r.id) AS review_count
FROM courses c
JOIN reviews r ON c.id = r.course_id
GROUP BY c.id
HAVING review_count >= 10
ORDER BY review_count DESC;

-- 5. Leia kõik õpilased koos nende hetkel registreeritud kursustega
-- See päring näitab, millised õpilased on registreerunud ja millised kursused nad on valinud.
SELECT 
    u.name AS student_name,
    c.title AS course_title,
    uc.enrolled_at AS enrollment_date
FROM users u
JOIN user_courses uc ON u.id = uc.user_id
JOIN courses c ON uc.course_id = c.id
WHERE u.role = 'student'
ORDER BY u.name, c.title;

-- 6. Leia kursuste arv ja keskmine edusamm igas kursuses
-- See päring annab ülevaate, kui palju õpilasi on kursustes ja kuidas nad edenevad.
SELECT 
    c.title AS course_title,
    COUNT(uc.user_id) AS enrolled_students,
    AVG(uc.progress) AS average_progress
FROM courses c
LEFT JOIN user_courses uc ON c.id = uc.course_id
GROUP BY c.id
ORDER BY enrolled_students DESC;