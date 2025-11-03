import { Database } from 'bun:sqlite';
import { faker } from '@faker-js/faker';

// Configuration
const BATCH_SIZE = 1000;
const TEACHER_COUNT = 1000;
const STUDENT_COUNT = 20000;
const COURSE_COUNT = 5000;
const ENROLLMENT_TARGET = 2000000;

// Database connection
const db = new Database('skillshare.db');

async function disableIndexes() {
  console.log('Disabling indexes...');
  db.prepare('ALTER TABLE users DISABLE KEYS').run();
  db.prepare('ALTER TABLE courses DISABLE KEYS').run();
  db.prepare('ALTER TABLE reviews DISABLE KEYS').run();
  db.prepare('ALTER TABLE user_courses DISABLE KEYS').run();
}

async function enableIndexes() {
  console.log('Rebuilding indexes...');
  db.prepare('ALTER TABLE users ENABLE KEYS').run();
  db.prepare('ALTER TABLE courses ENABLE KEYS').run();
  db.prepare('ALTER TABLE reviews ENABLE KEYS').run();
  db.prepare('ALTER TABLE user_courses ENABLE KEYS').run();
}

async function seedUsers() {
  console.log('Seeding users...');
  let progress = 0;
  
  // Teachers
  for (let i = 0; i < TEACHER_COUNT; i += BATCH_SIZE) {
    const values = Array(Math.min(BATCH_SIZE, TEACHER_COUNT - i))
      .fill(0)
      .map(() => ({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: 'teacher',
        created_at: faker.date.past().toISOString()
      }));
      
    db.prepare(`
      INSERT INTO users (name, email, role, created_at)
      VALUES ${values.map(() => '(?, ?, ?, ?)').join(',')}
    `).run(values.flatMap(v => [v.name, v.email, v.role, v.created_at]));

    progress += values.length;
    if (progress % 10000 === 0) {
      console.log(`Progress: ${progress} users`);
    }
  }

  // Students
  for (let i = 0; i < STUDENT_COUNT; i += BATCH_SIZE) {
    const values = Array(Math.min(BATCH_SIZE, STUDENT_COUNT - i))
      .fill(0)
      .map(() => ({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: 'student',
        created_at: faker.date.past().toISOString()
      }));

    db.prepare(`
      INSERT INTO users (name, email, role, created_at) 
      VALUES ${values.map(() => '(?, ?, ?, ?)').join(',')}
    `).run(values.flatMap(v => [v.name, v.email, v.role, v.created_at]));

    progress += values.length;
    if (progress % 10000 === 0) {
      console.log(`Progress: ${progress} users`);
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

    db.prepare(`
      INSERT INTO courses (title, description, teacher_id, created_at)
      VALUES ${values.map(() => '(?, ?, ?, ?)').join(',')}
    `).run(values.flatMap(v => [v.title, v.description, v.teacher_id, v.created_at]));

    progress += values.length;
    if (progress % 1000 === 0) {
      console.log(`Progress: ${progress} courses`);
    }
  }
}

async function seedEnrollments() {
  console.log('Seeding enrollments...');
  let progress = 0;

  const studentIds = db.prepare('SELECT id FROM users WHERE role = "student"').all().map(u => u.id);
  const courseIds = db.prepare('SELECT id FROM courses').all().map(c => c.id);

  for (let i = 0; i < ENROLLMENT_TARGET; i += BATCH_SIZE) {
    const values = Array(Math.min(BATCH_SIZE, ENROLLMENT_TARGET - i))
      .fill(0)
      .map(() => ({
        user_id: faker.helpers.arrayElement(studentIds),
        course_id: faker.helpers.arrayElement(courseIds),
        enrolled_at: faker.date.past().toISOString(),
        progress: faker.number.float({ min: 0, max: 100, precision: 2 })
      }));

    db.prepare(`
      INSERT INTO user_courses (user_id, course_id, enrolled_at, progress)
      VALUES ${values.map(() => '(?, ?, ?, ?)').join(',')}
    `).run(values.flatMap(v => [v.user_id, v.course_id, v.enrolled_at, v.progress]));

    progress += values.length;
    if (progress % 100000 === 0) {
      console.log(`Progress: ${progress} enrollments`);
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

    db.prepare(`
      INSERT INTO reviews (user_id, course_id, rating, comment, created_at)
      VALUES ${values.map(() => '(?, ?, ?, ?, ?)').join(',')}
    `).run(values.flatMap(v => [v.user_id, v.course_id, v.rating, v.comment, v.created_at]));

    progress += values.length;
    if (progress % 50000 === 0) {
      console.log(`Progress: ${progress} reviews`);
    }
  }
}

async function main() {
  console.time('Seeding duration');
  
  await disableIndexes();
  
  await seedUsers();
  await seedCourses();
  await seedEnrollments();
  await seedReviews();
  
  await enableIndexes();
  
  console.timeEnd('Seeding duration');
}

main().catch(console.error);