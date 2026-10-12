import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getSafePool } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'todo_calendar_jwt_secret_key_2026'

// 1. Phone Verification: Send code (Mock / Dev Mode)
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
      devCode: code, // 개발/테스트용 임시 인증번호 반환
    })
  } catch (err) {
    console.error('[Send Code Error]:', err)
    res.status(500).json({ error: '인증번호 발송 중 오류가 발생했습니다.' })
  }
})

// 2. Phone Verification: Verify code
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

// 3. Check Username Availability
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

// 4. Local Sign Up
router.post('/signup', async (req, res) => {
  const { username, password, name, phoneNumber } = req.body

  if (!username || !password || !name || !phoneNumber) {
    return res.status(400).json({ error: '모든 필수 항목(아이디, 비밀번호, 이름, 전화번호)을 입력해주세요.' })
  }

  const cleanUsername = username.trim()
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')

  if (cleanUsername.length < 3 || cleanUsername.length > 20) {
    return res.status(400).json({ error: '아이디는 3~20자 사이여야 합니다.' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' })
  }

  const pool = await getSafePool()
  if (!pool) {
    return res.status(503).json({ error: '데이터베이스에 연결되지 않았습니다.' })
  }

  try {
    // 휴대폰 인증 여부 확인
    const [verifyRows] = await pool.query(
      'SELECT id FROM phone_verifications WHERE phone_number = ? AND verified = true ORDER BY id DESC LIMIT 1',
      [cleanPhone]
    )

    if (verifyRows.length === 0) {
      return res.status(400).json({ error: '전화번호 인증이 완료되지 않았습니다. 인증번호를 확인해주세요.' })
    }

    // 아이디 중복 확인
    const [userRows] = await pool.query('SELECT id FROM users WHERE username = ?', [cleanUsername])
    if (userRows.length > 0) {
      return res.status(400).json({ error: '이미 사용 중인 아이디입니다.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, name, phone_number, phone_verified, provider) VALUES (?, ?, ?, ?, true, "local")',
      [cleanUsername, passwordHash, name.trim(), cleanPhone]
    )

    const userId = result.insertId
    const token = jwt.sign(
      { id: userId, username: cleanUsername, name: name.trim(), provider: 'local' },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.status(201).json({
      user: {
        id: userId,
        username: cleanUsername,
        name: name.trim(),
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
      'SELECT id, username, password_hash, name, provider FROM users WHERE username = ? AND provider = "local"',
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
      'SELECT id, username, name, email, phone_number, provider, created_at FROM users WHERE id = ?',
      [req.user.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
    }

    res.json({ user: rows[0] })
  } catch (err) {
    console.error('[Me Error]:', err)
    res.status(500).json({ error: '사용자 정보 조회 실패' })
  }
})

export default router
