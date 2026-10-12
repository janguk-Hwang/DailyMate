import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase, getSafePool, getDbStatus } from './db.js'
import authRouter from './routes/auth.js'
import oauthRouter from './routes/oauth.js'
import { authMiddleware } from './middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3001

app.set('trust proxy', 1)
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

// Authentication Routes
app.use('/api/auth', authRouter)
app.use('/api/auth', oauthRouter)

// ---------------- Protected Schedule Routes (User Scoped) ----------------

// Get schedules for current user
app.get('/api/schedules', authMiddleware, async (req, res) => {
  const { date, month } = req.query
  const userId = req.user.id
  const pool = await getSafePool()

  if (!pool) {
    const errorDetails = getDbStatus().error || 'MySQL 연결 정보가 올바르지 않습니다.'
    return res.status(503).json({
      error: '데이터베이스에 연결되지 않았습니다.',
      details: errorDetails,
    })
  }

  try {
    let query = 'SELECT * FROM schedules WHERE user_id = ?'
    let params = [userId]

    if (date) {
      query += ' AND date = ? ORDER BY order_index ASC, id DESC'
      params.push(date)
    } else if (month) {
      query += ' AND date LIKE ? ORDER BY date ASC, order_index ASC, id DESC'
      params.push(`${month}%`)
    } else {
      query += ' ORDER BY date DESC, order_index ASC, id DESC'
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
    console.error('[Get Schedules Error]:', err)
    res.status(500).json({ error: err.message })
  }
})

// Reorder schedules for current user (Placed BEFORE /:id route)
app.put('/api/schedules/reorder', authMiddleware, async (req, res) => {
  const { orderIds } = req.body
  const userId = req.user.id
  const pool = await getSafePool()

  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  if (!Array.isArray(orderIds)) {
    return res.status(400).json({ error: 'orderIds 목록이 필요합니다.' })
  }

  try {
    for (let i = 0; i < orderIds.length; i++) {
      await pool.query(
        'UPDATE schedules SET order_index = ? WHERE id = ? AND user_id = ?',
        [i, orderIds[i], userId]
      )
    }
    res.json({ success: true, message: '순서가 저장되었습니다.' })
  } catch (err) {
    console.error('[Reorder Schedules Error]:', err)
    res.status(500).json({ error: err.message })
  }
})

// Create schedule for current user
app.post('/api/schedules', authMiddleware, async (req, res) => {
  const { title, date, priority = 'medium' } = req.body
  const userId = req.user.id
  const pool = await getSafePool()

  if (!pool) {
    const errorDetails = getDbStatus().error || 'MySQL 연결 정보가 올바르지 않습니다.'
    return res.status(503).json({
      error: `데이터베이스에 연결되지 않았습니다: ${errorDetails}`,
    })
  }

  if (!title || !date) {
    return res.status(400).json({ error: '제목(title)과 날짜(date)는 필수 입력 항목입니다.' })
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO schedules (user_id, title, date, completed, priority) VALUES (?, ?, ?, false, ?)',
      [userId, title.trim(), date, priority]
    )
    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      title: title.trim(),
      date,
      completed: false,
      priority,
    })
  } catch (err) {
    console.error('[Create Schedule Error]:', err)
    res.status(500).json({ error: `일정 저장 실패: ${err.message}` })
  }
})

// Batch create schedules (기간/반복/다중 날짜)
app.post('/api/schedules/batch', authMiddleware, async (req, res) => {
  const { title, dates, schedules: customSchedules, priority = 'medium' } = req.body
  const userId = req.user.id
  const pool = await getSafePool()

  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  let itemsToInsert = []
  if (Array.isArray(customSchedules) && customSchedules.length > 0) {
    itemsToInsert = customSchedules.map((s) => ({
      title: (s.title || '').trim(),
      date: s.date,
      priority: s.priority || 'medium',
    }))
  } else if (title && Array.isArray(dates) && dates.length > 0) {
    const trimmedTitle = title.trim()
    itemsToInsert = dates.map((d) => ({
      title: trimmedTitle,
      date: d,
      priority,
    }))
  } else {
    return res.status(400).json({ error: '등록할 일정 정보와 날짜 목록이 필요합니다.' })
  }

  try {
    const createdItems = []
    for (const item of itemsToInsert) {
      if (!item.title || !item.date) continue
      const [result] = await pool.query(
        'INSERT INTO schedules (user_id, title, date, completed, priority, order_index) VALUES (?, ?, ?, false, ?, 0)',
        [userId, item.title, item.date, item.priority]
      )
      createdItems.push({
        id: result.insertId,
        user_id: userId,
        title: item.title,
        date: item.date,
        completed: false,
        priority: item.priority,
        order_index: 0,
      })
    }

    res.status(201).json({
      success: true,
      count: createdItems.length,
      schedules: createdItems,
    })
  } catch (err) {
    console.error('[Batch Schedules Error]:', err)
    res.status(500).json({ error: `일괄 일정 저장 실패: ${err.message}` })
  }
})

// Update schedule for current user
app.put('/api/schedules/:id', authMiddleware, async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  const { title, completed, priority, date } = req.body
  const pool = await getSafePool()

  if (!pool) {
    return res.status(503).json({
      error: 'Database not connected',
      details: getDbStatus().error,
    })
  }

  try {
    // 1. Check if schedule exists for this user (or unassigned sample schedule)
    const [existing] = await pool.query(
      'SELECT * FROM schedules WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
      [id, userId]
    )

    if (existing.length === 0) {
      return res.status(404).json({ error: '일정을 찾을 수 없거나 수정 권한이 없습니다.' })
    }

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

    // Always ensure user_id is assigned to current user
    updates.push('user_id = ?')
    params.push(userId)

    params.push(id)

    await pool.query(
      `UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    const [rows] = await pool.query('SELECT * FROM schedules WHERE id = ?', [id])
    res.json({
      ...rows[0],
      completed: Boolean(rows[0].completed),
    })
  } catch (err) {
    console.error('[Update Schedule Error]:', err)
    res.status(500).json({ error: err.message })
  }
})

// Delete schedule for current user
app.delete('/api/schedules/:id', authMiddleware, async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  const pool = await getSafePool()

  if (!pool) {
    return res.status(503).json({
      error: 'Database not connected',
      details: getDbStatus().error,
    })
  }

  try {
    const [result] = await pool.query(
      'DELETE FROM schedules WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
      [id, userId]
    )
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '일정을 찾을 수 없거나 삭제 권한이 없습니다.' })
    }
    res.json({ success: true, message: 'Deleted successfully' })
  } catch (err) {
    console.error('[Delete Schedule Error]:', err)
    res.status(500).json({ error: err.message })
  }
})

// Delete completed schedules for a date for current user
app.delete('/api/schedules/completed/:date', authMiddleware, async (req, res) => {
  const { date } = req.params
  const userId = req.user.id
  const pool = await getSafePool()

  if (!pool) {
    return res.status(503).json({
      error: 'Database not connected',
      details: getDbStatus().error,
    })
  }

  try {
    await pool.query('DELETE FROM schedules WHERE date = ? AND completed = 1 AND user_id = ?', [
      date,
      userId,
    ])
    res.json({ success: true, message: 'Cleared completed schedules' })
  } catch (err) {
    console.error('[Clear Completed Error]:', err)
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
