import express from 'express'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { getSafePool } from '../db.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'todo_calendar_jwt_secret_key_2026'

const getRedirectBase = (req) => {
  // If behind proxy or custom host
  const host = req.get('host')
  const protocol = req.protocol
  return `${protocol}://${host}`
}

const getClientUrl = (req) => {
  return process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`
}

async function findOrCreateSocialUser(provider, providerId, name, email) {
  const pool = await getSafePool()
  if (!pool) throw new Error('Database not connected')

  const [existing] = await pool.query(
    'SELECT id, username, name, email, provider FROM users WHERE provider = ? AND provider_id = ?',
    [provider, String(providerId)]
  )

  if (existing.length > 0) return existing[0]

  const displayName = name || `${provider}_사용자`
  const [result] = await pool.query(
    'INSERT INTO users (provider, provider_id, name, email) VALUES (?, ?, ?, ?)',
    [provider, String(providerId), displayName, email || null]
  )

  return { id: result.insertId, username: null, name: displayName, email: email || null, provider }
}

// ---------------- Google OAuth ----------------
router.get('/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId || clientId.trim() === '') {
    return res.status(200).json({
      configured: false,
      message: 'Google Client ID가 .env에 설정되지 않았습니다. 구글 클라우드 콘솔에서 발급받은 키를 .env에 입력해주세요.',
    })
  }

  const redirectUri = `${getRedirectBase(req)}/api/auth/google/callback`
  const scope = encodeURIComponent('openid profile email')
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline`

  res.json({ configured: true, url })
})

router.get('/google/callback', async (req, res) => {
  const { code } = req.query
  const clientUrl = getClientUrl(req)

  if (!code) {
    return res.redirect(`${clientUrl}/?auth_error=${encodeURIComponent('Google 인증 코드가 전달되지 않았습니다.')}`)
  }

  try {
    const redirectUri = `${getRedirectBase(req)}/api/auth/google/callback`
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    })

    const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
    })

    const profile = userRes.data
    const user = await findOrCreateSocialUser('google', profile.id, profile.name, profile.email)
    const token = jwt.sign(
      { id: user.id, name: user.name, provider: 'google' },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.redirect(`${clientUrl}/?token=${token}`)
  } catch (err) {
    console.error('[Google OAuth Error]:', err.response?.data || err.message)
    res.redirect(`${clientUrl}/?auth_error=${encodeURIComponent('구글 로그인 처리에 실패했습니다.')}`)
  }
})

// ---------------- Kakao OAuth ----------------
router.get('/kakao/url', (req, res) => {
  const clientId = process.env.KAKAO_CLIENT_ID
  if (!clientId || clientId.trim() === '') {
    return res.status(200).json({
      configured: false,
      message: 'Kakao REST API 키가 .env에 설정되지 않았습니다. 카카오 디벨로퍼스에서 발급받은 REST API 키를 .env에 입력해주세요.',
    })
  }

  const redirectUri = `${getRedirectBase(req)}/api/auth/kakao/callback`
  const url = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`

  res.json({ configured: true, url })
})

router.get('/kakao/callback', async (req, res) => {
  const { code } = req.query
  const clientUrl = getClientUrl(req)

  if (!code) {
    return res.redirect(`${clientUrl}/?auth_error=${encodeURIComponent('카카오 인증 코드가 전달되지 않았습니다.')}`)
  }

  try {
    const redirectUri = `${getRedirectBase(req)}/api/auth/kakao/callback`
    const params = new URLSearchParams()
    params.append('grant_type', 'authorization_code')
    params.append('client_id', process.env.KAKAO_CLIENT_ID)
    if (process.env.KAKAO_CLIENT_SECRET) {
      params.append('client_secret', process.env.KAKAO_CLIENT_SECRET)
    }
    params.append('redirect_uri', redirectUri)
    params.append('code', code)

    const tokenRes = await axios.post('https://kauth.kakao.com/oauth/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
    })

    const profile = userRes.data
    const nickname = profile.properties?.nickname || profile.kakao_account?.profile?.nickname || '카카오 사용자'
    const email = profile.kakao_account?.email || null

    const user = await findOrCreateSocialUser('kakao', profile.id, nickname, email)
    const token = jwt.sign(
      { id: user.id, name: user.name, provider: 'kakao' },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.redirect(`${clientUrl}/?token=${token}`)
  } catch (err) {
    console.error('[Kakao OAuth Error]:', err.response?.data || err.message)
    res.redirect(`${clientUrl}/?auth_error=${encodeURIComponent('카카오 로그인 처리에 실패했습니다.')}`)
  }
})

// ---------------- Naver OAuth ----------------
router.get('/naver/url', (req, res) => {
  const clientId = process.env.NAVER_CLIENT_ID
  if (!clientId || clientId.trim() === '') {
    return res.status(200).json({
      configured: false,
      message: 'Naver Client ID가 .env에 설정되지 않았습니다. 네이버 개발자 센터에서 발급받은 Client ID를 .env에 입력해주세요.',
    })
  }

  const redirectUri = `${getRedirectBase(req)}/api/auth/naver/callback`
  const state = Math.random().toString(36).substring(2, 12)
  const url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

  res.json({ configured: true, url })
})

router.get('/naver/callback', async (req, res) => {
  const { code, state } = req.query
  const clientUrl = getClientUrl(req)

  if (!code) {
    return res.redirect(`${clientUrl}/?auth_error=${encodeURIComponent('네이버 인증 코드가 전달되지 않았습니다.')}`)
  }

  try {
    const tokenRes = await axios.get('https://nid.naver.com/oauth2.0/token', {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        code,
        state,
      },
    })

    const userRes = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
    })

    const profile = userRes.data.response
    const nickname = profile.name || profile.nickname || '네이버 사용자'
    const email = profile.email || null

    const user = await findOrCreateSocialUser('naver', profile.id, nickname, email)
    const token = jwt.sign(
      { id: user.id, name: user.name, provider: 'naver' },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.redirect(`${clientUrl}/?token=${token}`)
  } catch (err) {
    console.error('[Naver OAuth Error]:', err.response?.data || err.message)
    res.redirect(`${clientUrl}/?auth_error=${encodeURIComponent('네이버 로그인 처리에 실패했습니다.')}`)
  }
})

export default router
