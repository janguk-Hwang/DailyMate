import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase, getSafePool, getDbStatus } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Health check / DB Status
app.get('/api/status', async (req, res) => {
  const pool = await getSafePool()
  const status = getDbStatus()
  res.json({
    server: 'running',
    database: status,
    hasPool: Boolean(pool),
    timestamp: new Date().toISOString(),
  })
})

// Reconnect endpoint (if user changes .env and wants to retry connection)
app.post('/api/reconnect', async (req, res) => {
  const success = await initDatabase()
  res.json({
    success,
    database: getDbStatus(),
  })
})

// Get schedules
app.get('/api/schedules', async (req, res) => {
  const { date, month } = req.query
  const pool = await getSafePool()

  if (!pool) {
    const errorDetails = getDbStatus().error || 'MySQL 연결 정보(MYSQL_URL)가 설정되지 않았습니다.'
    return res.status(503).json({
      error: '데이터베이스에 연결되지 않았습니다.',
      details: errorDetails,
    })
  }

  try {
    let query = 'SELECT * FROM schedules'
    let params = []

    if (date) {
      query += ' WHERE date = ? ORDER BY id DESC'
      params.push(date)
    } else if (month) {
      query += ' WHERE date LIKE ? ORDER BY date ASC, id DESC'
      params.push(`${month}%`)
    } else {
      query += ' ORDER BY date DESC, id DESC'
    }

    const [rows] = await pool.query(query, params)
    const formatted = rows.map((r) => ({
      ...r,
      completed: Boolean(r.completed),
    }))
    res.json(formatted)
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json([])
    }
    res.status(500).json({ error: err.message })
  }
})

// Create schedule
app.post('/api/schedules', async (req, res) => {
  const { title, date, priority = 'medium' } = req.body
  const pool = await getSafePool()

  if (!pool) {
    const errorDetails = getDbStatus().error || 'MySQL 연결 정보(MYSQL_URL)가 설정되지 않았습니다.'
    return res.status(503).json({
      error: `데이터베이스에 연결되지 않았습니다: ${errorDetails}`,
    })
  }

  if (!title || !date) {
    return res.status(400).json({ error: '제목(title)과 날짜(date)는 필수 입력 항목입니다.' })
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO schedules (title, date, completed, priority) VALUES (?, ?, false, ?)',
      [title.trim(), date, priority]
    )
    res.status(201).json({
      id: result.insertId,
      title: title.trim(),
      date,
      completed: false,
      priority,
    })
  } catch (err) {
    console.error('[Create Schedule Error]:', err)
    if (err.code === 'ER_NO_SUCH_TABLE') {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS schedules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            date VARCHAR(10) NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `)
        const [retryResult] = await pool.query(
          'INSERT INTO schedules (title, date, completed, priority) VALUES (?, ?, false, ?)',
          [title.trim(), date, priority]
        )
        return res.status(201).json({
          id: retryResult.insertId,
          title: title.trim(),
          date,
          completed: false,
          priority,
        })
      } catch (retryErr) {
        return res.status(500).json({ error: `일정 저장 실패: ${retryErr.message}` })
      }
    }
    res.status(500).json({ error: `일정 저장 실패: ${err.message}` })
  }
})

// Update schedule
app.put('/api/schedules/:id', async (req, res) => {
  const { id } = req.params
  const { title, completed, priority, date } = req.body
  const pool = await getSafePool()

  if (!pool) {
    return res.status(503).json({
      error: 'Database not connected',
      details: getDbStatus().error,
    })
  }

  try {
    const updates = []
    const params = []

    if (title !== undefined) {
      updates.push('title = ?')
      params.push(title.trim())
    }
    if (completed !== undefined) {
      updates.push('completed = ?')
      params.push(completed ? 1 : 0)
    }
    if (priority !== undefined) {
      updates.push('priority = ?')
      params.push(priority)
    }
    if (date !== undefined) {
      updates.push('date = ?')
      params.push(date)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    params.push(id)
    await pool.query(
      `UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    const [rows] = await pool.query('SELECT * FROM schedules WHERE id = ?', [id])
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' })
    }

    res.json({
      ...rows[0],
      completed: Boolean(rows[0].completed),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete schedule
app.delete('/api/schedules/:id', async (req, res) => {
  const { id } = req.params
  const pool = await getSafePool()

  if (!pool) {
    return res.status(503).json({
      error: 'Database not connected',
      details: getDbStatus().error,
    })
  }

  try {
    const [result] = await pool.query('DELETE FROM schedules WHERE id = ?', [id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Schedule not found' })
    }
    res.json({ success: true, message: 'Deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete completed for a date
app.delete('/api/schedules/completed/:date', async (req, res) => {
  const { date } = req.params
  const pool = await getSafePool()

  if (!pool) {
    return res.status(503).json({
      error: 'Database not connected',
      details: getDbStatus().error,
    })
  }

  try {
    await pool.query('DELETE FROM schedules WHERE date = ? AND completed = 1', [
      date,
    ])
    res.json({ success: true, message: 'Cleared completed schedules' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Serve production frontend assets from Vite build
const distPath = path.resolve(__dirname, '../dist')
app.use(express.static(distPath))

// 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' })
})

// Catch-all route for Single Page Application (SPA)
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

async function start() {
  await initDatabase()
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend API Server running at http://0.0.0.0:${PORT}`)
  })
}

start()
