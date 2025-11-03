import 'dotenv/config';
import mysql from 'mysql2/promise';
import { faker } from '@faker-js/faker';

// Config (from .env or defaults)
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'Skillshare';
const DB_ROOT_PASS = process.env.DB_ROOT_PASS || process.env.DB_PASS || '';

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 1000);
const TEACHER_COUNT = Number(process.env.TEACHER_COUNT || 1000);
const STUDENT_COUNT = Number(process.env.STUDENT_COUNT || 20000);
const COURSE_COUNT = Number(process.env.COURSE_COUNT || 5000);
const ENROLLMENT_TARGET = Number(process.env.ENROLLMENT_TARGET || 2000000);

function generateEmail(role, idx) {
  const domain = role === 'teacher' ? 'skillshare.edu' : 'student.com';
  return `${role}${idx}@${domain}`;
}

async function getRootConnection() {
  // try root (useful to create db if needed)
  try {
    return await mysql.createConnection({
      host: DB_HOST, port: DB_PORT, user: 'root', password: DB_ROOT_PASS
    });
  } catch {
    // fallback to DB_USER connection
    return await mysql.createConnection({
      host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASS
    });
  }
}

async function main() {
  console.time('Seeding duration');

  const rootConn = await getRootConnection();
  try {
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await rootConn.end();
  }

  const pool = mysql.createPool({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASS,
    waitForConnections: true, connectionLimit: 10, queueLimit: 0, database: DB_NAME
  });

  const conn = await pool.getConnection();
  try {
    // Create tables (idempotent)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        role VARCHAR(32) NOT NULL,
        created_at DATETIME NOT NULL,
        INDEX (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        teacher_id INT UNSIGNED NOT NULL,
        created_at DATETIME NOT NULL,
        INDEX (teacher_id),
        FOREIGN KEY (teacher_id) REFERENCES users(id)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_courses (
        user_id INT UNSIGNED NOT NULL,
        course_id INT UNSIGNED NOT NULL,
        enrolled_at DATETIME NOT NULL,
        progress DECIMAL(5,2) NOT NULL,
        PRIMARY KEY (user_id, course_id),
        INDEX (course_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        course_id INT UNSIGNED NOT NULL,
        rating TINYINT NOT NULL,
        comment TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        INDEX (user_id),
        INDEX (course_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (course_id) REFERENCES courses(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Performance: disable checks during bulk insert
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    await conn.query('SET UNIQUE_CHECKS=0');
    await conn.query('SET AUTOCOMMIT=0');

    // Seed users
    console.log('Seeding users...');
    let idx = 1;
    for (let t = 0; t < TEACHER_COUNT; t += BATCH_SIZE) {
      const batch = [];
      const n = Math.min(BATCH_SIZE, TEACHER_COUNT - t);
      for (let i = 0; i < n; i++, idx++) {
        batch.push([faker.person.fullName(), generateEmail('teacher', idx), 'teacher', faker.date.past().toISOString().slice(0, 19).replace('T', ' ')]);
      }
      await conn.query('INSERT INTO users (name,email,role,created_at) VALUES ?', [batch]);
    }
    for (let s = 0; s < STUDENT_COUNT; s += BATCH_SIZE) {
      const batch = [];
      const n = Math.min(BATCH_SIZE, STUDENT_COUNT - s);
      for (let i = 0; i < n; i++, idx++) {
        batch.push([faker.person.fullName(), generateEmail('student', idx), 'student', faker.date.past().toISOString().slice(0, 19).replace('T', ' ')]);
      }
      await conn.query('INSERT INTO users (name,email,role,created_at) VALUES ?', [batch]);
    }

    // Seed courses
    console.log('Seeding courses...');
    const [teachersRows] = await conn.query('SELECT id FROM users WHERE role = ?', ['teacher']);
    const teacherIds = teachersRows.map(r => r.id);
    for (let c = 0; c < COURSE_COUNT; c += BATCH_SIZE) {
      const batch = [];
      const n = Math.min(BATCH_SIZE, COURSE_COUNT - c);
      for (let i = 0; i < n; i++) {
        const teacher_id = teacherIds[Math.floor(Math.random() * teacherIds.length)];
        batch.push([faker.company.catchPhrase(), faker.lorem.paragraphs(2), teacher_id, faker.date.past().toISOString().slice(0, 19).replace('T', ' ')]);
      }
      await conn.query('INSERT INTO courses (title,description,teacher_id,created_at) VALUES ?', [batch]);
    }

    // Seed enrollments
    console.log('Seeding enrollments...');
    const [studentRows] = await conn.query('SELECT id FROM users WHERE role = ?', ['student']);
    const [courseRows] = await conn.query('SELECT id FROM courses');
    const studentIds = studentRows.map(r => r.id);
    const courseIds = courseRows.map(r => r.id);

    const used = new Set();
    let created = 0;
    while (created < ENROLLMENT_TARGET) {
      const batch = [];
      const n = Math.min(BATCH_SIZE, ENROLLMENT_TARGET - created);
      while (batch.length < n) {
        const uid = studentIds[Math.floor(Math.random() * studentIds.length)];
        const cid = courseIds[Math.floor(Math.random() * courseIds.length)];
        const key = `${uid}-${cid}`;
        if (!used.has(key)) {
          used.add(key);
          batch.push([uid, cid, faker.date.past().toISOString().slice(0, 19).replace('T', ' '), (Math.random() * 100).toFixed(2)]);
        }
      }
      await conn.query('INSERT INTO user_courses (user_id,course_id,enrolled_at,progress) VALUES ?', [batch]);
      created += batch.length;
      if (created % 50000 === 0) console.log(`Enrollments: ${created}/${ENROLLMENT_TARGET}`);
    }

    // Seed reviews (limit)
    console.log('Seeding reviews...');
    const reviewLimit = Math.min(500000, Math.floor(ENROLLMENT_TARGET * 0.25));
    const [enrRows] = await conn.query('SELECT user_id, course_id FROM user_courses LIMIT ?', [reviewLimit]);
    for (let i = 0; i < enrRows.length; i += BATCH_SIZE) {
      const slice = enrRows.slice(i, i + BATCH_SIZE);
      const batchRows = slice.map(r => [
        r.user_id,
        r.course_id,
        Math.floor(Math.random() * 5) + 1,
        faker.lorem.paragraph(),
        faker.date.past().toISOString().slice(0, 19).replace('T', ' ')
      ]);
      await conn.query('INSERT INTO reviews (user_id,course_id,rating,comment,created_at) VALUES ?', [batchRows]);
      if ((i + BATCH_SIZE) % 10000 === 0) console.log(`Reviews: ${Math.min(i + BATCH_SIZE, enrRows.length)}/${enrRows.length}`);
    }

    // Commit and restore checks
    await conn.query('COMMIT');
    await conn.query('SET FOREIGN_KEY_CHECKS=1');
    await conn.query('SET UNIQUE_CHECKS=1');
    await conn.query('SET AUTOCOMMIT=1');

    console.timeEnd('Seeding duration');
    console.log('Seeding finished. Kontrolli phpMyAdminis andmeid.');
  } catch (err) {
    try { await conn.query('ROLLBACK'); } catch {}
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });