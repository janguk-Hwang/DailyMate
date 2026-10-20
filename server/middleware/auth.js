import jwt from 'jsonwebtoken'
import { cleanEnv } from '../utils/env.js'

const JWT_SECRET = cleanEnv(process.env.JWT_SECRET) || 'todo_calendar_jwt_secret_key_2026'

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  let token = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim()
  } else if (req.query && req.query.token) {
    token = req.query.token
  }

  if (!token) {
    return res.status(401).json({ error: '로그인이 필요한 서비스입니다.' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: '인증 토큰이 만료되었거나 유효하지 않습니다.' })
  }
}

export function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  let token = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim()
  } else if (req.query && req.query.token) {
    token = req.query.token
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.user = decoded
    } catch (err) {
      req.user = null
    }
  } else {
    req.user = null
  }

  next()
}
