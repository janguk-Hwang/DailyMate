import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
}

const dbName = process.env.DB_NAME || 'todo_calendar_db'

let pool = null
let dbStatus = {
  connected: false,
  error: null,
}

export async function initDatabase() {
  try {
    dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true })

    const dbName = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || 'todo_calendar_db'
    const connectionUri = process.env.MYSQL_URL || process.env.DATABASE_URL

    console.log('[DB Config Check]', {
      hasMysqlUrl: Boolean(process.env.MYSQL_URL),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasMysqlHost: Boolean(process.env.MYSQLHOST),
      dbName,
    })

    if (connectionUri) {
      console.log('[DB Init] Connecting via URI...')
      // Ensure utf8mb4 encoding for Korean characters
      const uriWithCharset = connectionUri.includes('?')
        ? (connectionUri.includes('charset=') ? connectionUri : `${connectionUri}&charset=utf8mb4`)
        : `${connectionUri}?charset=utf8mb4`

      pool = mysql.createPool(uriWithCharset)
    } else {
      const dbConfig = {
        host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        port: Number(process.env.MYSQLPORT || process.env.DB_PORT) || 3306,
        user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || process.env.DB_PASSWORD || '',
        charset: 'utf8mb4',
      }

      // Root connection to ensure database exists (for local or custom servers)
      try {
        const tempConnection = await mysql.createConnection(dbConfig)
        await tempConnection.query(
          `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        )
        await tempConnection.end()
      } catch (dbErr) {
        console.warn(`[MySQL DB Check Notice]: ${dbErr.message}`)
      }

      pool = mysql.createPool({
        ...dbConfig,
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      })
    }

    // Verify connection by getting a connection
    const testConn = await pool.getConnection()
    await testConn.query('SET NAMES utf8mb4')
    testConn.release()

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

    // Ensure user_id and order_index columns exist on existing schedules table
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

    // 4. Check if empty, insert initial sample schedules
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
