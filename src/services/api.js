export async function getDbStatus() {
  try {
    const res = await fetch('/api/status')
    if (!res.ok) throw new Error('Status request failed')
    return await res.json()
  } catch (e) {
    return { server: 'offline', database: { connected: false, error: e.message } }
  }
}

export async function reconnectDb() {
  const res = await fetch('/api/reconnect', { method: 'POST' })
  return res.json()
}

export async function getMonthSchedules(month) {
  const res = await fetch(`/api/schedules?month=${month}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.details || data.error || `HTTP ${res.status}: 일정 목록 조회 실패`)
  }
  return res.json()
}

export async function createSchedule(data) {
  const res = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.details || err.error || `HTTP ${res.status}: 일정 등록 실패`)
  }
  return res.json()
}

export async function updateSchedule(id, updates) {
  const res = await fetch(`/api/schedules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update schedule')
  return res.json()
}

export async function deleteSchedule(id) {
  const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete schedule')
  return res.json()
}

export async function clearCompletedForDate(date) {
  const res = await fetch(`/api/schedules/completed/${date}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to clear completed schedules')
  return res.json()
}
