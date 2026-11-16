const TOKEN_KEY = 'todo_calendar_auth_token'

export const API_BASE = (typeof window !== 'undefined' && window.electronAPI)
  ? (import.meta.env.VITE_API_BASE_URL || 'https://dailymate.up.railway.app')
  : (import.meta.env.VITE_API_BASE_URL || '')

export function apiFetch(path, options) {
  const url = path.startsWith('/') ? `${API_BASE}${path}` : path
  return fetch(url, options)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

function getAuthHeaders() {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// ---------------- Database & Server Status ----------------
export async function getDbStatus() {
  try {
    const res = await apiFetch('/api/status')
    if (!res.ok) throw new Error('Status request failed')
    return await res.json()
  } catch (e) {
    return { server: 'offline', database: { connected: false, error: e.message } }
  }
}

export async function reconnectDb() {
  const res = await apiFetch('/api/reconnect', { method: 'POST' })
  return res.json()
}

// ---------------- Authentication APIs ----------------

// 1. Email Verification Code (dailymate Sender)
export async function sendEmailCode(email) {
  const res = await apiFetch('/api/auth/email/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '이메일 인증번호 발송에 실패했습니다.')
  return data
}

// 2. Verify Email Code
export async function verifyEmailCode(email, code) {
  const res = await apiFetch('/api/auth/email/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '인증번호 확인에 실패했습니다.')
  return data
}

// 3. Phone SMS Code (Mock / Dev - Legacy)
export async function sendPhoneCode(phoneNumber) {
  const res = await apiFetch('/api/auth/phone/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '인증번호 발송에 실패했습니다.')
  return data
}

// 4. Verify Phone SMS Code (Legacy)
export async function verifyPhoneCode(phoneNumber, code) {
  const res = await apiFetch('/api/auth/phone/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, code }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '인증번호 확인에 실패했습니다.')
  return data
}

// 5. Check Username Availability
export async function checkUsernameAvailability(username) {
  const res = await apiFetch('/api/auth/check-username', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '아이디 중복 검사에 실패했습니다.')
  return data
}

// 6. Local Sign Up (Email Verification)
export async function signupUser({ username, password, name, email, phoneNumber }) {
  const res = await apiFetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, name, email, phoneNumber }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '회원가입에 실패했습니다.')
  if (data.token) {
    setToken(data.token)
  }
  return data
}

// 5. Local Login
export async function loginUser({ username, password }) {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '로그인에 실패했습니다.')
  if (data.token) {
    setToken(data.token)
  }
  return data
}

// 6. Get Current User (Me)
export async function getCurrentUser() {
  const token = getToken()
  if (!token) return null

  const res = await apiFetch('/api/auth/me', {
    headers: getAuthHeaders(),
  })
  if (res.status === 401) {
    removeToken()
    return null
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '사용자 정보를 불러올 수 없습니다.')
  return data.user
}

// 7. Get OAuth Login URL
export async function getOAuthUrl(provider) {
  const res = await apiFetch(`/api/auth/${provider}/url`)
  const data = await res.json()
  return data
}

// ---------------- Protected Schedules APIs ----------------
export async function getMonthSchedules(month) {
  const token = getToken()
  if (!token) return []

  const res = await apiFetch(`/api/schedules?month=${month}`, {
    headers: getAuthHeaders(),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.details || data.error || `HTTP ${res.status}: 일정 목록 조회 실패`)
  }
  return res.json()
}

export async function createSchedule(data) {
  const res = await apiFetch('/api/schedules', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.details || err.error || `HTTP ${res.status}: 일정 등록 실패`)
  }
  return res.json()
}

export async function updateSchedule(id, updates) {
  const res = await apiFetch(`/api/schedules/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.details || err.error || `HTTP ${res.status}: 일정 수정 실패`)
  }
  return res.json()
}

export async function deleteSchedule(id) {
  const res = await apiFetch(`/api/schedules/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.details || err.error || `HTTP ${res.status}: 일정 삭제 실패`)
  }
  return res.json()
}

export async function clearCompletedForDate(date) {
  const res = await apiFetch(`/api/schedules/completed/${date}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.details || err.error || `HTTP ${res.status}: 완료 일정 삭제 실패`)
  }
  return res.json()
}

export async function reorderSchedules(orderIds) {
  const res = await apiFetch('/api/schedules/reorder', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderIds }),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  if (!res.ok) throw new Error('Failed to reorder schedules')
  return res.json()
}

export async function createBatchSchedules(payload) {
  const res = await apiFetch('/api/schedules/batch', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.details || err.error || `HTTP ${res.status}: 일괄 일정 등록 실패`)
  }
  return res.json()
}

export async function toggleAllSchedulesForDate(date, completed) {
  const res = await apiFetch(`/api/schedules/toggle-all/${date}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ completed }),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.details || err.error || `HTTP ${res.status}: 전체 일정 상태 변경 실패`)
  }
  return res.json()
}

export async function updateBatchSchedulesCompleted(ids, completed) {
  const res = await apiFetch('/api/schedules/batch-completed', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ids, completed }),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.details || err.error || `HTTP ${res.status}: 선택 일정 상태 변경 실패`)
  }
  return res.json()
}

export async function deleteBatchSchedules(ids) {
  const res = await apiFetch('/api/schedules/batch', {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ids }),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.details || err.error || `HTTP ${res.status}: 선택 일정 삭제 실패`)
  }
  return res.json()
}

// ---------------- MyPage & Profile APIs ----------------
export async function updateProfile(payload) {
  const res = await apiFetch('/api/auth/profile', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '프로필 수정 실패')
  return data
}

export async function updatePassword({ currentPassword, newPassword }) {
  const res = await apiFetch('/api/auth/password', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '비밀번호 변경 실패')
  return data
}

export async function deleteAccount({ password }) {
  const res = await apiFetch('/api/auth/account', {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ password }),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '회원 탈퇴 처리 실패')
  removeToken()
  return data
}

export async function getUserStats() {
  const res = await apiFetch('/api/auth/stats', {
    headers: getAuthHeaders(),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '통계 조회 실패')
  return data
}

// ---------------- Settings APIs ----------------
export async function getUserSettings() {
  const res = await apiFetch('/api/auth/settings', {
    headers: getAuthHeaders(),
  })
  if (!res.ok) return { settings: {} }
  const data = await res.json()
  return data.settings || {}
}

export async function updateUserSettings(settings) {
  const res = await apiFetch('/api/auth/settings', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ settings }),
  })
  if (!res.ok) throw new Error('설정 저장 실패')
  return res.json()
}

// ---------------- Data Backup & Maintenance APIs ----------------
export async function exportSchedules() {
  const res = await apiFetch('/api/schedules/export', {
    headers: getAuthHeaders(),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  if (!res.ok) throw new Error('일정 내보내기 실패')
  return res.json()
}

export async function cleanupAllCompletedSchedules() {
  const res = await apiFetch('/api/schedules/completed-all', {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (res.status === 401) {
    removeToken()
    throw new Error('AUTH_REQUIRED')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '전체 완료 일정 정리 실패')
  return data
}

export async function submitFeedback({ category, title, content, contact }) {
  const res = await apiFetch('/api/feedback', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ category, title, content, contact }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '제보 접수에 실패했습니다.')
  return data
}
