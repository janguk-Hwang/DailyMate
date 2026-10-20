import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { cleanEnv } from './utils/env.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

let pool = null
let dbStatus = {
  connected: false,
  error: null,
}

const isValidEnv = (val) => {
  if (!val) return false
  const s = String(val).trim()
  return s !== '' && !s.includes('${{')
}

export async function initDatabase() {
  try {
    dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true })

    const rawDbName =
      cleanEnv(process.env.MYSQLDATABASE) ||
      cleanEnv(process.env.MYSQL_DATABASE) ||
      cleanEnv(process.env.DB_NAME)
    const dbName = isValidEnv(rawDbName) ? rawDbName : 'railway'

    const rawUri = cleanEnv(process.env.MYSQL_URL || process.env.DATABASE_URL)
    const isValidUri = isValidEnv(rawUri) && (rawUri.startsWith('mysql://') || rawUri.startsWith('mysql2://'))

    let activePool = null

    // 1. Connect via MYSQL_URL / DATABASE_URL
    if (isValidUri) {
      const uriWithCharset = rawUri.includes('?')
        ? (rawUri.includes('charset=') ? rawUri : `${rawUri}&charset=utf8mb4`)
        : `${rawUri}?charset=utf8mb4`

      activePool = mysql.createPool({
        uri: uriWithCharset,
        waitForConnections: true,
        connectionLimit: 10,
      })
    } else {
      // 2. Connect via discrete parameters
      const host =
        (isValidEnv(cleanEnv(process.env.MYSQLHOST)) && cleanEnv(process.env.MYSQLHOST)) ||
        (isValidEnv(cleanEnv(process.env.DB_HOST)) && cleanEnv(process.env.DB_HOST)) ||
        'localhost'

      const port = Number(cleanEnv(process.env.MYSQLPORT || process.env.DB_PORT)) || 3306
      const user = cleanEnv(process.env.MYSQLUSER || process.env.DB_USER) || 'root'
      const password =
        cleanEnv(process.env.MYSQLPASSWORD) ||
        cleanEnv(process.env.MYSQL_ROOT_PASSWORD) ||
        cleanEnv(process.env.DB_PASSWORD) ||
        ''

      activePool = mysql.createPool({
        host,
        port,
        user,
        password,
        database: dbName,
        charset: 'utf8mb4',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      })
    }

    // Verify connection
    const testConn = await activePool.getConnection()
    await testConn.query('SET NAMES utf8mb4')
    testConn.release()

    pool = activePool

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NULL,
        password_hash VARCHAR(255) NULL,
        phone_number VARCHAR(20) NULL,
        phone_verified BOOLEAN DEFAULT FALSE,
        provider ENUM('local', 'google', 'kakao', 'naver') NOT NULL DEFAULT 'local',
        provider_id VARCHAR(100) NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_provider (provider, provider_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // Create phone_verifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS phone_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // Create email_verifications table (dailymate email auth)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // Create schedules table if not exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        title VARCHAR(255) NOT NULL,
        date VARCHAR(10) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
    await pool.query(createTableQuery)

    // Ensure columns exist on tables
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM schedules LIKE 'user_id'`)
      if (cols.length === 0) {
        await pool.query(`ALTER TABLE schedules ADD COLUMN user_id INT NULL AFTER id`)
      }
      const [orderCols] = await pool.query(`SHOW COLUMNS FROM schedules LIKE 'order_index'`)
      if (orderCols.length === 0) {
        await pool.query(`ALTER TABLE schedules ADD COLUMN order_index INT DEFAULT 0 AFTER priority`)
      }
      const [descCols] = await pool.query(`SHOW COLUMNS FROM schedules LIKE 'description'`)
      if (descCols.length === 0) {
        await pool.query(`ALTER TABLE schedules ADD COLUMN description TEXT NULL AFTER title`)
      }

      // Ensure avatar and settings columns exist on users table
      const [avatarCols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'avatar'`)
      if (avatarCols.length === 0) {
        await pool.query(`ALTER TABLE users ADD COLUMN avatar VARCHAR(50) DEFAULT '🧑‍💻' AFTER name`)
      } else {
        await pool.query(`ALTER TABLE users MODIFY COLUMN avatar VARCHAR(50) DEFAULT '🧑‍💻'`)
      }
      await pool.query(`UPDATE users SET avatar = '🧑‍💻' WHERE avatar = 'user' OR avatar IS NULL OR avatar = ''`)

      const [settingsCols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'settings'`)
      if (settingsCols.length === 0) {
        await pool.query(`ALTER TABLE users ADD COLUMN settings TEXT NULL AFTER email`)
      }

      const [emailVerifiedCols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'email_verified'`)
      if (emailVerifiedCols.length === 0) {
        await pool.query(`ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE AFTER email`)
      }

      // Create feedbacks table if not exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS feedbacks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          category ENUM('feature', 'bug', 'other') DEFAULT 'feature',
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          contact VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `)
    } catch (colErr) {
      console.warn('[Check Column Notice]:', colErr.message)
    }

    // Initial sample schedules
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM schedules')
    if (rows[0].count === 0) {
      const today = new Date().toISOString().slice(0, 10)
      const sampleQueries = [
        ['MySQL 데이터베이스 연동 확인하기', today, false, 'high'],
        ['일정 관리 캘린더 화면 구성하기', today, true, 'medium'],
        ['주간 할 일 계획 세우기', today, false, 'low'],
      ]
      for (const item of sampleQueries) {
        await pool.query(
          'INSERT INTO schedules (title, date, completed, priority) VALUES (?, ?, ?, ?)',
          item
        )
      }
    }

    dbStatus = { connected: true, error: null }
    console.log(`[MySQL] Successfully connected to database: ${dbName}`)
    return true
  } catch (err) {
    const errorMsg = err.code ? `[${err.code}] ${err.message}` : (err.message || String(err))
    dbStatus = { connected: false, error: errorMsg }
    console.error(`[MySQL Connection Failed]: ${errorMsg}`)
    pool = null
    return false
  }
}

export function getPool() {
  return pool
}

export async function getSafePool() {
  if (!pool) {
    await initDatabase()
  }
  return pool
}

export function getDbStatus() {
  return dbStatus
}
