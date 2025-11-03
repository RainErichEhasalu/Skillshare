import { Database } from 'bun:sqlite';
import { faker } from '@faker-js/faker';

// Configuration
const BATCH_SIZE = 1000;
const TEACHER_COUNT = 1000;
const STUDENT_COUNT = 20000;
const COURSE_COUNT = 5000;
const ENROLLMENT_TARGET = 2000000;

// Track used enrollments for uniqueness
const usedEnrollments = new Set();

function generateUniqueEmail(role, index) {
  const domain = role === 'teacher' ? 'skillshare.edu' : 'student.com';
  return `${role}${index}@${domain}`;
}

// Database connection
const db = new Database('skillshare.db');

function createTables() {
  console.log('Creating tables if they don\'t exist...');
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME NOT NULL
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      teacher_id INTEGER NOT NULL,
      created_at DATETIME NOT NULL,
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS user_courses (
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      enrolled_at DATETIME NOT NULL,
      progress DECIMAL(5,2) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      PRIMARY KEY (user_id, course_id)
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )
  `).run();
}

async function disableIndexes() {
  console.log('Optimizing for bulk insert...');
  db.prepare('PRAGMA synchronous = OFF').run();
  db.prepare('PRAGMA journal_mode = MEMORY').run();
  db.prepare('BEGIN TRANSACTION').run();
}

async function enableIndexes() {
  console.log('Restoring normal operation mode...');
  db.prepare('COMMIT').run();
  db.prepare('PRAGMA synchronous = NORMAL').run();
  db.prepare('PRAGMA journal_mode = DELETE').run();
}

async function seedUsers() {
  console.log('Seeding users...');
  let progress = 0;
  
  // Teachers
  for (let i = 0; i < TEACHER_COUNT; i += BATCH_SIZE) {
    const values = Array(Math.min(BATCH_SIZE, TEACHER_COUNT - i))
      .fill(0)
      .map((_, idx) => ({
        name: faker.person.fullName(),
        email: generateUniqueEmail('teacher', i + idx + 1),
        role: 'teacher',
        created_at: faker.date.past().toISOString()
      }));
      
    const placeholders = values.map(() => '(?, ?, ?, ?)').join(',');
    const params = values.flatMap(v => [v.name, v.email, v.role, v.created_at]);
    
    db.prepare(`
      INSERT INTO users (name, email, role, created_at)
      VALUES ${placeholders}
    `).run(params);

    progress += values.length;
    if (progress % 200 === 0) {
      console.log(`Progress: ${progress}/${TEACHER_COUNT} teachers`);
    }
  }

  // Students
  for (let i = 0; i < STUDENT_COUNT; i += BATCH_SIZE) {
    const values = Array(Math.min(BATCH_SIZE, STUDENT_COUNT - i))
      .fill(0)
      .map((_, idx) => ({
        name: faker.person.fullName(),
        email: generateUniqueEmail('student', i + idx + 1),
        role: 'student',
        created_at: faker.date.past().toISOString()
      }));

    const placeholders = values.map(() => '(?, ?, ?, ?)').join(',');
    const params = values.flatMap(v => [v.name, v.email, v.role, v.created_at]);

    db.prepare(`
      INSERT INTO users (name, email, role, created_at) 
      VALUES ${placeholders}
    `).run(params);

    progress += values.length;
    if (progress % 1000 === 0) {
      console.log(`Progress: ${progress}/${STUDENT_COUNT} students`);
    }
  }
}

async function seedCourses() {
  console.log('Seeding courses...');
  let progress = 0;
  
  const teacherIds = db.prepare('SELECT id FROM users WHERE role = "teacher"').all().map(u => u.id);
  
  for (let i = 0; i < COURSE_COUNT; i += BATCH_SIZE) {
    const values = Array(Math.min(BATCH_SIZE, COURSE_COUNT - i))
      .fill(0)
      .map(() => ({
        title: faker.company.catchPhrase(),
        description: faker.lorem.paragraphs(2),
        teacher_id: faker.helpers.arrayElement(teacherIds),
        created_at: faker.date.past().toISOString()
      }));

    const placeholders = values.map(() => '(?, ?, ?, ?)').join(',');
    const params = values.flatMap(v => [v.title, v.description, v.teacher_id, v.created_at]);

    db.prepare(`
      INSERT INTO courses (title, description, teacher_id, created_at)
      VALUES ${placeholders}
    `).run(params);

    progress += values.length;
    if (progress % 500 === 0) {
      console.log(`Progress: ${progress}/${COURSE_COUNT} courses`);
    }
  }
}

async function seedEnrollments() {
  console.log('Seeding enrollments...');
  let progress = 0;

  const studentIds = db.prepare('SELECT id FROM users WHERE role = "student"').all().map(u => u.id);
  const courseIds = db.prepare('SELECT id FROM courses').all().map(c => c.id);

  for (let i = 0; i < ENROLLMENT_TARGET; i += BATCH_SIZE) {
    const values = [];
    const batchSize = Math.min(BATCH_SIZE, ENROLLMENT_TARGET - i);
    
    while (values.length < batchSize) {
      const user_id = faker.helpers.arrayElement(studentIds);
      const course_id = faker.helpers.arrayElement(courseIds);
      const enrollmentKey = `${user_id}-${course_id}`;
      
      if (!usedEnrollments.has(enrollmentKey)) {
        values.push({
          user_id,
          course_id,
          enrolled_at: faker.date.past().toISOString(),
          progress: faker.number.float({ min: 0, max: 100, precision: 2 })
        });
        usedEnrollments.add(enrollmentKey);
      }
    }

    if (values.length > 0) {
      const placeholders = values.map(() => '(?, ?, ?, ?)').join(',');
      const params = values.flatMap(v => [v.user_id, v.course_id, v.enrolled_at, v.progress]);

      db.prepare(`
        INSERT INTO user_courses (user_id, course_id, enrolled_at, progress)
        VALUES ${placeholders}
      `).run(params);

      progress += values.length;
      if (progress % 50000 === 0) {
        console.log(`Progress: ${progress}/${ENROLLMENT_TARGET} enrollments`);
      }
    }
  }
}

async function seedReviews() {
  console.log('Seeding reviews...');
  let progress = 0;

  const enrollments = db.prepare('SELECT user_id, course_id FROM user_courses LIMIT 500000').all();

  for (let i = 0; i < enrollments.length; i += BATCH_SIZE) {
    const batch = enrollments.slice(i, i + BATCH_SIZE);
    const values = batch.map(enrollment => ({
      user_id: enrollment.user_id,
      course_id: enrollment.course_id,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.paragraph(),
      created_at: faker.date.past().toISOString()
    }));

    const placeholders = values.map(() => '(?, ?, ?, ?, ?)').join(',');
    const params = values.flatMap(v => [v.user_id, v.course_id, v.rating, v.comment, v.created_at]);

    db.prepare(`
      INSERT INTO reviews (user_id, course_id, rating, comment, created_at)
      VALUES ${placeholders}
    `).run(params);

    progress += values.length;
    if (progress % 10000 === 0) {
      console.log(`Progress: ${progress}/${enrollments.length} reviews`);
    }
  }
}

async function main() {
  console.time('Seeding duration');
  
  createTables();
  await disableIndexes();
  
  await seedUsers();
  await seedCourses();
  await seedEnrollments();
  await seedReviews();
  
  await enableIndexes();
  
  console.timeEnd('Seeding duration');
  
  console.log('Database seeding completed successfully!');
}

main().catch(console.error);