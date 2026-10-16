import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getSafePool } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { sendVerificationEmail } from '../services/mailService.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'todo_calendar_jwt_secret_key_2026'

// 1. Email Verification: Send code (dailymate Sender)
router.post('/email/send-code', async (req, res) => {
  const { email } = req.body
  if (!email || !email.trim()) {
    return res.status(400).json({ error: '이메일 주소를 입력해주세요.' })
  }

  const cleanEmail = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: '올바른 이메일 주소 형식이 아닙니다.' })
  }

  const pool = await getSafePool()
  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  try {
    // Check if email already registered
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail])
    if (existing.length > 0) {
      return res.status(400).json({ error: '이미 가입된 이메일 주소입니다. 다른 이메일을 입력해주세요.' })
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000) // 3분 유효

    await pool.query('DELETE FROM email_verifications WHERE email = ?', [cleanEmail])
    await pool.query(
      'INSERT INTO email_verifications (email, code, expires_at, verified) VALUES (?, ?, ?, false)',
      [cleanEmail, code, expiresAt]
    )

    // Send email using dailymate mail service
    const mailResult = await sendVerificationEmail(cleanEmail, code)

    res.json({
      success: true,
      message: '인증번호가 이메일로 발송되었습니다. (3분 이내 입력)',
      devCode: mailResult.devCode || (process.env.NODE_ENV !== 'production' ? code : undefined),
    })
  } catch (err) {
    console.error('[Send Email Code Error]:', err)
    res.status(500).json({ error: err.message || '인증번호 이메일 발송 중 오류가 발생했습니다.' })
  }
})

// 2. Email Verification: Verify code
router.post('/email/verify-code', async (req, res) => {
  const { email, code } = req.body
  if (!email || !code) {
    return res.status(400).json({ error: '이메일과 인증번호를 모두 입력해주세요.' })
  }

  const cleanEmail = email.trim().toLowerCase()
  const pool = await getSafePool()
  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, expires_at FROM email_verifications WHERE email = ? AND code = ? ORDER BY id DESC LIMIT 1',
      [cleanEmail, code.trim()]
    )

    if (rows.length === 0) {
      return res.status(400).json({ error: '인증번호가 일치하지 않습니다.' })
    }

    const verification = rows[0]
    if (new Date() > new Date(verification.expires_at)) {
      return res.status(400).json({ error: '인증번호가 만료되었습니다. 다시 발송 요청해주세요.' })
    }

    await pool.query('UPDATE email_verifications SET verified = true WHERE id = ?', [verification.id])
    res.json({ success: true, message: '이메일 인증이 완료되었습니다.' })
  } catch (err) {
    console.error('[Verify Email Code Error]:', err)
    res.status(500).json({ error: '인증번호 확인 중 오류가 발생했습니다.' })
  }
})

// 3. Phone Verification: Send code (Mock / Dev Mode - Legacy compatibility)
router.post('/phone/send-code', async (req, res) => {
  const { phoneNumber } = req.body
  if (!phoneNumber) {
    return res.status(400).json({ error: '전화번호를 입력해주세요.' })
  }

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
  if (!/^01[0-9]{8,9}$/.test(cleanPhone)) {
    return res.status(400).json({ error: '올바른 휴대폰 번호(010XXXXXXXX) 형식이 아닙니다.' })
  }

  const pool = await getSafePool()
  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000)

    await pool.query('DELETE FROM phone_verifications WHERE phone_number = ?', [cleanPhone])
    await pool.query(
      'INSERT INTO phone_verifications (phone_number, code, expires_at, verified) VALUES (?, ?, ?, false)',
      [cleanPhone, code, expiresAt]
    )

    console.log(`[SMS DEV MOCK] 전화번호: ${cleanPhone} | 임시 인증번호: [ ${code} ]`)

    res.json({
      success: true,
      message: '인증번호가 발송되었습니다. (3분 이내 입력)',
      devCode: code,
    })
  } catch (err) {
    console.error('[Send Code Error]:', err)
    res.status(500).json({ error: '인증번호 발송 중 오류가 발생했습니다.' })
  }
})

// 4. Phone Verification: Verify code (Legacy compatibility)
router.post('/phone/verify-code', async (req, res) => {
  const { phoneNumber, code } = req.body
  if (!phoneNumber || !code) {
    return res.status(400).json({ error: '전화번호와 인증번호를 모두 입력해주세요.' })
  }

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
  const pool = await getSafePool()
  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, expires_at FROM phone_verifications WHERE phone_number = ? AND code = ? ORDER BY id DESC LIMIT 1',
      [cleanPhone, code.trim()]
    )

    if (rows.length === 0) {
      return res.status(400).json({ error: '인증번호가 일치하지 않습니다.' })
    }

    const verification = rows[0]
    if (new Date() > new Date(verification.expires_at)) {
      return res.status(400).json({ error: '인증번호가 만료되었습니다. 다시 발송 요청해주세요.' })
    }

    await pool.query('UPDATE phone_verifications SET verified = true WHERE id = ?', [verification.id])
    res.json({ success: true, message: '전화번호 인증이 완료되었습니다.' })
  } catch (err) {
    console.error('[Verify Code Error]:', err)
    res.status(500).json({ error: '인증번호 확인 중 오류가 발생했습니다.' })
  }
})

// 5. Check Username Availability
router.post('/check-username', async (req, res) => {
  const { username } = req.body
  if (!username || username.trim().length < 3) {
    return res.status(400).json({ error: '아이디는 3자 이상이어야 합니다.' })
  }

  const cleanUsername = username.trim()
  const pool = await getSafePool()
  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [cleanUsername])
    if (rows.length > 0) {
      return res.json({ available: false, message: '이미 사용 중인 아이디입니다.' })
    }
    res.json({ available: true, message: '사용 가능한 아이디입니다.' })
  } catch (err) {
    console.error('[Check Username Error]:', err)
    res.status(500).json({ error: '아이디 중복 검사 실패' })
  }
})

// 6. Local Sign Up (Email Verification required)
router.post('/signup', async (req, res) => {
  const { username, password, name, email, phoneNumber } = req.body

  if (!username || !password || !name || !email) {
    return res.status(400).json({ error: '모든 필수 항목(아이디, 비밀번호, 닉네임, 이메일)을 입력해주세요.' })
  }

  const cleanUsername = username.trim()
  const cleanEmail = email.trim().toLowerCase()
  const cleanPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : null

  if (cleanUsername.length < 3 || cleanUsername.length > 20) {
    return res.status(400).json({ error: '아이디는 3~20자 사이여야 합니다.' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: '올바른 이메일 주소 형식이 아닙니다.' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' })
  }

  const pool = await getSafePool()
  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  try {
    // 1) 이메일 인증 여부 확인
    const [verifyRows] = await pool.query(
      'SELECT id FROM email_verifications WHERE email = ? AND verified = true ORDER BY id DESC LIMIT 1',
      [cleanEmail]
    )

    if (verifyRows.length === 0) {
      return res.status(400).json({ error: '이메일 인증이 완료되지 않았습니다. 인증번호를 확인해주세요.' })
    }

    // 2) 아이디 중복 확인
    const [userRows] = await pool.query('SELECT id FROM users WHERE username = ?', [cleanUsername])
    if (userRows.length > 0) {
      return res.status(400).json({ error: '이미 사용 중인 아이디입니다.' })
    }

    // 3) 이메일 중복 확인
    const [emailRows] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail])
    if (emailRows.length > 0) {
      return res.status(400).json({ error: '이미 가입된 이메일 주소입니다.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, name, email, email_verified, phone_number, provider, avatar) VALUES (?, ?, ?, ?, true, ?, "local", "🧑‍💻")',
      [cleanUsername, passwordHash, name.trim(), cleanEmail, cleanPhone]
    )

    const userId = result.insertId
    const token = jwt.sign(
      { id: userId, username: cleanUsername, name: name.trim(), email: cleanEmail, provider: 'local' },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.status(201).json({
      user: {
        id: userId,
        username: cleanUsername,
        name: name.trim(),
        email: cleanEmail,
        phoneNumber: cleanPhone,
        provider: 'local',
      },
      token,
    })
  } catch (err) {
    console.error('[Signup Error]:', err)
    res.status(500).json({ error: `회원가입 실패: ${err.message}` })
  }
})

// 5. Local Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' })
  }

  const pool = await getSafePool()
  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, password_hash, name, provider, avatar FROM users WHERE username = ? AND provider = "local"',
      [username.trim()]
    )

    if (rows.length === 0) {
      return res.status(400).json({ error: '존재하지 않는 아이디이거나 비밀번호가 일치하지 않습니다.' })
    }

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
      return res.status(400).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name, provider: 'local' },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        provider: 'local',
        avatar: (!user.avatar || user.avatar === 'user') ? '🧑‍💻' : user.avatar,
      },
      token,
    })
  } catch (err) {
    console.error('[Login Error]:', err)
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' })
  }
})

// 6. Get Current User (Me)
router.get('/me', authMiddleware, async (req, res) => {
  const pool = await getSafePool()
  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, name, email, phone_number, provider, avatar, settings, created_at FROM users WHERE id = ?',
      [req.user.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
    }

    const userData = { ...rows[0] }
    userData.avatar = (!userData.avatar || userData.avatar === 'user') ? '🧑‍💻' : userData.avatar
    if (userData.settings && typeof userData.settings === 'string') {
      try {
        userData.settings = JSON.parse(userData.settings)
      } catch (e) {
        userData.settings = null
      }
    }

    res.json({ user: userData })
  } catch (err) {
    console.error('[Me Error]:', err)
    res.status(500).json({ error: '사용자 정보 조회 실패' })
  }
})

// 7. Update User Profile (Name, Avatar, Phone)
router.put('/profile', authMiddleware, async (req, res) => {
  const { name, avatar, phoneNumber } = req.body
  const userId = req.user.id

  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: '닉네임을 입력해주세요.' })
  }

  const pool = await getSafePool()
  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  try {
    let query = 'UPDATE users SET id = id'
    const params = []

    if (name !== undefined) {
      query += ', name = ?'
      params.push(name.trim())
    }

    if (avatar !== undefined) {
      query += ', avatar = ?'
      params.push(avatar)
    }

    if (phoneNumber !== undefined) {
      const cleanPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : null
      query += ', phone_number = ?'
      params.push(cleanPhone)
    }

    query += ' WHERE id = ?'
    params.push(userId)

    await pool.query(query, params)

    const [rows] = await pool.query(
      'SELECT id, username, name, email, phone_number, provider, avatar, settings, created_at FROM users WHERE id = ?',
      [userId]
    )

    const updatedUser = { ...rows[0] }
    updatedUser.avatar = (!updatedUser.avatar || updatedUser.avatar === 'user') ? '🧑‍💻' : updatedUser.avatar
    if (updatedUser.settings && typeof updatedUser.settings === 'string') {
      try {
        updatedUser.settings = JSON.parse(updatedUser.settings)
      } catch (e) {
        updatedUser.settings = null
      }
    }

    res.json({
      success: true,
      message: '프로필 정보가 성공적으로 변경되었습니다.',
      user: updatedUser,
    })
  } catch (err) {
    console.error('[Update Profile Error]:', err)
    res.status(500).json({ error: '프로필 수정 중 오류가 발생했습니다.' })
  }
})

// 8. Update Password (Local Users only)
router.put('/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user.id

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: '새 비밀번호는 최소 6자 이상이어야 합니다.' })
  }

  const pool = await getSafePool()
  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  try {
    const [rows] = await pool.query('SELECT provider, password_hash FROM users WHERE id = ?', [userId])
    if (rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
    }

    const user = rows[0]
    if (user.provider !== 'local') {
      return res.status(400).json({ error: '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.' })
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isMatch) {
      return res.status(400).json({ error: '현재 비밀번호가 일치하지 않습니다.' })
    }

    const newHash = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId])

    res.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' })
  } catch (err) {
    console.error('[Update Password Error]:', err)
    res.status(500).json({ error: '비밀번호 변경 중 오류가 발생했습니다.' })
  }
})

// 9. Delete Account (Withdrawal)
router.delete('/account', authMiddleware, async (req, res) => {
  const { password } = req.body || {}
  const userId = req.user.id

  const pool = await getSafePool()
  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  try {
    const [rows] = await pool.query('SELECT provider, password_hash FROM users WHERE id = ?', [userId])
    if (rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
    }

    const user = rows[0]
    if (user.provider === 'local') {
      if (!password) {
        return res.status(400).json({ error: '본인 확인을 위해 비밀번호를 입력해주세요.' })
      }
      const isMatch = await bcrypt.compare(password, user.password_hash)
      if (!isMatch) {
        return res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' })
      }
    }

    // Delete user's schedules first, then delete user
    await pool.query('DELETE FROM schedules WHERE user_id = ?', [userId])
    await pool.query('DELETE FROM users WHERE id = ?', [userId])

    res.json({ success: true, message: '회원 탈퇴가 정상적으로 처리되었습니다. 이용해 주셔서 감사합니다.' })
  } catch (err) {
    console.error('[Delete Account Error]:', err)
    res.status(500).json({ error: '회원 탈퇴 처리 중 오류가 발생했습니다.' })
  }
})

// 10. Get User Productivity Stats (Total, Completion rate, Streak, Monthly)
router.get('/stats', authMiddleware, async (req, res) => {
  const userId = req.user.id
  const pool = await getSafePool()
  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  try {
    // Total & Completed counts
    const [totalRows] = await pool.query(
      `SELECT 
        COUNT(*) AS totalCount,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS completedCount
       FROM schedules 
       WHERE user_id = ?`,
      [userId]
    )

    const totalCount = Number(totalRows[0]?.totalCount || 0)
    const completedCount = Number(totalRows[0]?.completedCount || 0)
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    // Current Month stats
    const now = new Date()
    const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const [monthRows] = await pool.query(
      `SELECT 
        COUNT(*) AS monthTotal,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS monthCompleted
       FROM schedules 
       WHERE user_id = ? AND date LIKE ?`,
      [userId, `${currentYm}%`]
    )

    const monthTotal = Number(monthRows[0]?.monthTotal || 0)
    const monthCompleted = Number(monthRows[0]?.monthCompleted || 0)
    const monthRate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0

    // Streak calculation (연속 완수)
    // 규칙:
    // 1. 일정이 비어있는 날(등록된 일정이 0개인 날)은 연속에 포함하지 않음 (카운트 증가 안함)
    // 2. 비어있는 날이 있더라도 연속이 끊기지 않고, '일정이 존재하는 날'만 연속 완수 여부 판단
    // 3. 일정이 존재하는 날의 모든 일정(completed === total)을 완료했을 때 완수한 날로 판정
    // 4. 오늘(today)에 아직 미완료 일정이 남아있더라도(진행 중), 이전 일정 있는 날들의 연속 완수는 유지
    const todayDate = new Date()
    const formatD = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const todayStr = formatD(todayDate)

    const [scheduledDatesRows] = await pool.query(
      `SELECT 
        date,
        COUNT(*) AS totalCount,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS completedCount
       FROM schedules 
       WHERE user_id = ? AND date <= ?
       GROUP BY date 
       ORDER BY date DESC`,
      [userId, todayStr]
    )

    let streakDays = 0

    if (scheduledDatesRows.length > 0) {
      let startIndex = 0
      const firstDay = scheduledDatesRows[0]
      const isFirstDayToday = firstDay.date === todayStr
      const isFirstDayFullyCompleted =
        Number(firstDay.totalCount) > 0 &&
        Number(firstDay.completedCount) === Number(firstDay.totalCount)

      if (isFirstDayToday) {
        if (isFirstDayFullyCompleted) {
          // 오늘 일정을 모두 완수한 경우 오늘부터 카운트 시작
          startIndex = 0
        } else {
          // 오늘은 아직 진행 중이므로 오늘을 제외하고 직전 일정이 있던 날부터 연속 완수 체크
          startIndex = 1
        }
      } else {
        // 오늘은 일정이 없는 날(비어있는 날)이므로, 가장 최근 일정이 있던 날부터 체크
        startIndex = 0
      }

      for (let i = startIndex; i < scheduledDatesRows.length; i++) {
        const day = scheduledDatesRows[i]
        const total = Number(day.totalCount)
        const completed = Number(day.completedCount)

        if (total > 0 && completed === total) {
          streakDays++
        } else {
          break
        }
      }
    }

    res.json({
      totalCount,
      completedCount,
      completionRate,
      currentMonth: {
        yearMonth: currentYm,
        total: monthTotal,
        completed: monthCompleted,
        rate: monthRate,
      },
      streakDays,
    })
  } catch (err) {
    console.error('[Get Stats Error]:', err)
    res.status(500).json({ error: '사용자 통계 조회 실패' })
  }
})

// 11. User Settings (Save / Get)
router.get('/settings', authMiddleware, async (req, res) => {
  const userId = req.user.id
  const pool = await getSafePool()
  if (!pool) return res.status(503).json({ error: '데이터베이스 연결 불가' })

  try {
    const [rows] = await pool.query('SELECT settings FROM users WHERE id = ?', [userId])
    let settings = {}
    if (rows.length > 0 && rows[0].settings) {
      try {
        settings = JSON.parse(rows[0].settings)
      } catch (e) {
        settings = {}
      }
    }
    res.json({ settings })
  } catch (err) {
    res.status(500).json({ error: '설정 조회 실패' })
  }
})

router.put('/settings', authMiddleware, async (req, res) => {
  const userId = req.user.id
  const { settings } = req.body
  const pool = await getSafePool()
  if (!pool) return res.status(503).json({ error: '데이터베이스 연결 불가' })

  try {
    const settingsStr = JSON.stringify(settings || {})
    await pool.query('UPDATE users SET settings = ? WHERE id = ?', [settingsStr, userId])
    res.json({ success: true, settings: settings || {} })
  } catch (err) {
    res.status(500).json({ error: '설정 저장 실패' })
  }
})

export default router

