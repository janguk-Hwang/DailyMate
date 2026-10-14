import { useState, useEffect, useCallback, useMemo } from 'react'
import { AlertCircle, CheckCheck, Lock, Sparkles, LogIn } from 'lucide-react'
import Navbar from './components/Navbar'
import Header from './components/Header'
import CalendarView from './components/CalendarView'
import TodoInput from './components/TodoInput'
import TodoFilter from './components/TodoFilter'
import TodoItem from './components/TodoItem'
import AuthModal from './components/AuthModal'
import MultiScheduleModal from './components/MultiScheduleModal'
import TodoDetailModal from './components/TodoDetailModal'
import SettingsAndMyPageModal from './components/SettingsAndMyPageModal'
import {
  getMonthSchedules,
  createSchedule,
  createBatchSchedules,
  updateSchedule,
  deleteSchedule,
  clearCompletedForDate,
  getCurrentUser,
  setToken,
  removeToken,
  reorderSchedules,
  toggleAllSchedulesForDate,
  updateUserSettings,
} from './services/api'

const getToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DEFAULT_SETTINGS = {
  startOfWeek: 'sunday', // 'sunday' | 'monday'
  defaultPriority: 'medium', // 'high' | 'medium' | 'low'
  completedDisplay: 'show', // 'show' | 'hide' | 'bottom'
  darkMode: 'system', // 'light' | 'dark' | 'system'
}

function loadInitialSettings() {
  try {
    const saved = localStorage.getItem('todo_calendar_settings')
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
  } catch (e) {
    console.warn('Failed to parse saved settings:', e)
  }
  return DEFAULT_SETTINGS
}

export default function App() {
  const [selectedDate, setSelectedDate] = useState(getToday)
  const [currentYearMonth, setCurrentYearMonth] = useState(() => getToday().slice(0, 7))
  const [allMonthTodos, setAllMonthTodos] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('custom') // 'custom' | 'priority' | 'created_desc' | 'created_asc'
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverInfo, setDragOverInfo] = useState(null) // { index, position: 'top' | 'bottom' }
  const [dbError, setDbError] = useState(null)

  // Settings & Theme
  const [settings, setSettings] = useState(loadInitialSettings)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [settingsModalTab, setSettingsModalTab] = useState('profile')
  const [isDark, setIsDark] = useState(false)

  // Dark Mode Sync Effect
  useEffect(() => {
    const updateTheme = () => {
      const mode = settings.darkMode || 'system'
      let dark = false
      if (mode === 'dark') {
        dark = true
      } else if (mode === 'light') {
        dark = false
      } else {
        dark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
      }
      setIsDark(dark)
      if (dark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    updateTheme()

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        if ((settings.darkMode || 'system') === 'system') {
          updateTheme()
        }
      }
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [settings.darkMode])

  // Auth States
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('login')
  const [multiModalOpen, setMultiModalOpen] = useState(false)
  const [selectedDetailTodo, setSelectedDetailTodo] = useState(null)
  const [oauthError, setOauthError] = useState(null)

  // 1. Initial OAuth URL check and Auto Login Check
  useEffect(() => {
    async function checkAuth() {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const tokenFromUrl = urlParams.get('token')
        const errorFromUrl = urlParams.get('auth_error')

        if (tokenFromUrl) {
          setToken(tokenFromUrl)
          window.history.replaceState({}, document.title, window.location.pathname)
        }

        if (errorFromUrl) {
          setOauthError(decodeURIComponent(errorFromUrl))
          window.history.replaceState({}, document.title, window.location.pathname)
        }

        const currentUser = await getCurrentUser()
        setUser(currentUser)

        if (currentUser?.settings) {
          setSettings((prev) => {
            const merged = { ...prev, ...currentUser.settings }
            localStorage.setItem('todo_calendar_settings', JSON.stringify(merged))
            return merged
          })
        }
      } catch (err) {
        console.error('[Check Auth Failed]:', err)
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Handle settings update
  const handleUpdateSettings = async (newSettings) => {
    setSettings(newSettings)
    localStorage.setItem('todo_calendar_settings', JSON.stringify(newSettings))
    if (user) {
      try {
        await updateUserSettings(newSettings)
      } catch (e) {
        console.warn('Failed to sync settings with server:', e)
      }
    }
  }

  const handleToggleDarkMode = () => {
    const nextMode = isDark ? 'light' : 'dark'
    handleUpdateSettings({ ...settings, darkMode: nextMode })
  }

  const handleOpenSettings = (tab = 'settings') => {
    setSettingsModalTab(tab)
    setSettingsModalOpen(true)
  }

  const handleUserUpdated = (updatedUser) => {
    setUser(updatedUser)
    if (updatedUser?.settings) {
      handleUpdateSettings({ ...settings, ...updatedUser.settings })
    }
  }

  // 2. Load Schedules (only if user is logged in)
  const loadSchedules = useCallback(async (ym) => {
    if (!user) {
      setAllMonthTodos([])
      return
    }

    try {
      const data = await getMonthSchedules(ym)
      setAllMonthTodos(data)
      setDbError(null)
    } catch (e) {
      console.error(e)
      if (e.message === 'AUTH_REQUIRED') {
        setUser(null)
        setAllMonthTodos([])
      } else {
        setDbError(e.message)
      }
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadSchedules(currentYearMonth)
    } else {
      setAllMonthTodos([])
    }
  }, [user, currentYearMonth, loadSchedules])

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser)
    setAuthModalOpen(false)
  }

  const handleLogout = () => {
    removeToken()
    setUser(null)
    setAllMonthTodos([])
  }

  const handleResetToday = () => {
    const todayStr = getToday()
    setSelectedDate(todayStr)
    setCurrentYearMonth(todayStr.slice(0, 7))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const monthlyCounts = useMemo(() => {
    const map = {}
    allMonthTodos.forEach((item) => {
      if (!map[item.date]) map[item.date] = { total: 0, completed: 0 }
      map[item.date].total += 1
      if (item.completed) map[item.date].completed += 1
    })
    return map
  }, [allMonthTodos])

  const currentDayTodos = useMemo(
    () => allMonthTodos.filter((t) => t.date === selectedDate),
    [allMonthTodos, selectedDate]
  )

  const handleAddTodo = async (titleOrTitles, priority) => {
    if (!user) {
      handleOpenAuth('login')
      return
    }

    const titles = Array.isArray(titleOrTitles)
      ? titleOrTitles
      : String(titleOrTitles)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)

    if (titles.length === 0) return

    try {
      if (titles.length === 1) {
        const created = await createSchedule({ title: titles[0], date: selectedDate, priority })
        setAllMonthTodos((prev) => [created, ...prev])
      } else {
        const res = await createBatchSchedules({
          titles,
          dates: [selectedDate],
          priority,
        })
        if (res.schedules && res.schedules.length > 0) {
          setAllMonthTodos((prev) => [...res.schedules, ...prev])
        }
      }
    } catch (e) {
      if (e.message === 'AUTH_REQUIRED') {
        handleOpenAuth('login')
      } else {
        alert(e.message || '일정 등록 실패')
      }
    }
  }

  const handleBatchAddTodo = async ({ title, titles, dates, priority }) => {
    if (!user) {
      handleOpenAuth('login')
      return
    }

    try {
      const titleList =
        Array.isArray(titles) && titles.length > 0
          ? titles
          : title
          ? String(title).split(',').map((t) => t.trim()).filter(Boolean)
          : []

      if (titleList.length === 0 || !dates || dates.length === 0) return

      const res = await createBatchSchedules({ titles: titleList, dates, priority })
      if (res.schedules && res.schedules.length > 0) {
        setAllMonthTodos((prev) => [...res.schedules, ...prev])
        await loadSchedules(currentYearMonth)
      }
    } catch (e) {
      if (e.message === 'AUTH_REQUIRED') {
        handleOpenAuth('login')
      } else {
        alert(e.message || '일괄 일정 등록 실패')
      }
    }
  }

  const handleToggle = async (id) => {
    if (!user) {
      handleOpenAuth('login')
      return
    }

    const target = allMonthTodos.find((t) => t.id === id)
    if (!target) return
    const nextCompleted = !target.completed
    setAllMonthTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t))
    )
    try {
      await updateSchedule(id, { completed: nextCompleted })
    } catch {
      setAllMonthTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !nextCompleted } : t))
      )
    }
  }

  const handleDelete = async (id) => {
    if (!user) {
      handleOpenAuth('login')
      return
    }

    const target = allMonthTodos.find((t) => t.id === id)
    const titleText = target?.title || target?.text || '해당 일정'
    if (!window.confirm(`'${titleText}' 일정을 정말 삭제하시겠습니까?`)) {
      return
    }

    try {
      await deleteSchedule(id)
      setAllMonthTodos((prev) => prev.filter((t) => t.id !== id))
    } catch (e) {
      alert(e.message || '일정 삭제 실패')
    }
  }

  const handleEdit = async (id, title, priority, description) => {
    if (!user) {
      handleOpenAuth('login')
      return
    }

    try {
      const payload = { title }
      if (priority !== undefined) {
        payload.priority = priority
      }
      if (description !== undefined) {
        payload.description = description
      }
      const updated = await updateSchedule(id, payload)
      const updatedTitle = updated.title || title
      const updatedPriority = updated.priority || priority
      const updatedDesc = updated.description !== undefined ? updated.description : description
      setAllMonthTodos((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                title: updatedTitle,
                text: updatedTitle,
                priority: updatedPriority,
                description: updatedDesc,
              }
            : t
        )
      )
      if (selectedDetailTodo && selectedDetailTodo.id === id) {
        setSelectedDetailTodo((prev) => ({
          ...prev,
          title: updatedTitle,
          text: updatedTitle,
          priority: updatedPriority,
          description: updatedDesc,
        }))
      }
    } catch (e) {
      alert(e.message || '일정 수정 실패')
    }
  }

  const handleOpenDetail = (todo) => {
    setSelectedDetailTodo(todo)
  }

  const handleDetailToggle = async (id) => {
    await handleToggle(id)
    setSelectedDetailTodo((prev) =>
      prev && prev.id === id ? { ...prev, completed: !prev.completed } : prev
    )
  }

  const handleSaveDetail = async (id, { title, description, priority }) => {
    await handleEdit(id, title, priority, description)
  }

  const handleClearCompleted = async () => {
    if (!user) {
      handleOpenAuth('login')
      return
    }

    if (!window.confirm(`${selectedDate}의 완료된 일정을 모두 삭제하시겠습니까?`)) return
    try {
      await clearCompletedForDate(selectedDate)
      setAllMonthTodos((prev) =>
        prev.filter((t) => !(t.date === selectedDate && t.completed))
      )
    } catch (e) {
      alert(e.message || '완료 항목 삭제 실패')
    }
  }

  const totalCount = currentDayTodos.length
  const completedCount = currentDayTodos.filter((t) => t.completed).length
  const activeCount = totalCount - completedCount
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
  const isAllCompleted = totalCount > 0 && currentDayTodos.every((t) => t.completed)

  const handleToggleAll = async () => {
    if (!user) {
      handleOpenAuth('login')
      return
    }
    if (currentDayTodos.length === 0) return

    const targetCompleted = !isAllCompleted
    setAllMonthTodos((prev) =>
      prev.map((t) => (t.date === selectedDate ? { ...t, completed: targetCompleted } : t))
    )
    try {
      await toggleAllSchedulesForDate(selectedDate, targetCompleted)
    } catch (err) {
      await loadSchedules(currentYearMonth)
      alert(err.message || '전체 일정 상태 변경 실패')
    }
  }

  const priorityWeights = { high: 3, medium: 2, low: 1 }

  const sortedTodos = useMemo(() => {
    let list = [...currentDayTodos]

    const matchFilter = (todo) => {
      // If completedDisplay === 'hide', hide completed items unless filter is explicitly 'completed'
      if (settings.completedDisplay === 'hide' && filter !== 'completed' && todo.completed) {
        return false
      }
      const match = filter === 'all' ? true : filter === 'active' ? !todo.completed : todo.completed
      const matchSearch = (todo.title || todo.text || '').toLowerCase().includes(search.toLowerCase())
      return match && matchSearch
    }

    list = list.filter(matchFilter)

    if (sortBy === 'priority') {
      list.sort((a, b) => {
        const pA = priorityWeights[a.priority] || 2
        const pB = priorityWeights[b.priority] || 2
        if (pB !== pA) return pB - pA
        return (b.id || 0) - (a.id || 0)
      })
    } else if (sortBy === 'created_desc') {
      list.sort((a, b) => (b.id || 0) - (a.id || 0))
    } else if (sortBy === 'created_asc') {
      list.sort((a, b) => (a.id || 0) - (b.id || 0))
    }

    // If completedDisplay === 'bottom', place completed items at the end of the list
    if (settings.completedDisplay === 'bottom' && filter === 'all') {
      list.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
    }

    return list
  }, [currentDayTodos, filter, search, sortBy, settings.completedDisplay])

  // Drag and drop handlers with insertion slot positioning
  const handleDragStart = (index, e) => {
    setDraggedIndex(index)
    setDragOverInfo(null)
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(index))
    }
  }

  const handleDragOverItem = (index, position) => {
    if (draggedIndex === null || draggedIndex === index) {
      if (dragOverInfo !== null) setDragOverInfo(null)
      return
    }
    if (dragOverInfo?.index !== index || dragOverInfo?.position !== position) {
      setDragOverInfo({ index, position })
    }
  }

  const handleDragLeaveItem = (index) => {
    if (dragOverInfo?.index === index) {
      setDragOverInfo(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverInfo(null)
  }

  const handleDrop = async (targetIndex, position = 'top') => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      setDragOverInfo(null)
      return
    }

    const fromIndex = draggedIndex
    const toIndex = targetIndex

    const reordered = [...sortedTodos]
    const [movedItem] = reordered.splice(fromIndex, 1)

    // Calculate insertion index
    let insertIndex = toIndex > fromIndex ? toIndex - 1 : toIndex
    if (position === 'bottom') {
      insertIndex += 1
    }

    insertIndex = Math.max(0, Math.min(insertIndex, reordered.length))
    reordered.splice(insertIndex, 0, movedItem)

    // Switch to custom sort if user drags in a sorted mode
    if (sortBy !== 'custom') {
      setSortBy('custom')
    }

    const otherDateTodos = allMonthTodos.filter((t) => t.date !== selectedDate)
    const reorderedIds = new Set(reordered.map((t) => t.id))
    const unshownThisDay = allMonthTodos.filter(
      (t) => t.date === selectedDate && !reorderedIds.has(t.id)
    )

    const updatedThisDay = [...reordered, ...unshownThisDay]
    setAllMonthTodos([...updatedThisDay, ...otherDateTodos])

    setDraggedIndex(null)
    setDragOverInfo(null)

    try {
      const orderIds = updatedThisDay.map((t) => t.id)
      await reorderSchedules(orderIds)
    } catch (err) {
      console.error('[Reorder Schedules Error]:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-200 dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-900 py-3.5 sm:py-10 px-3 sm:px-6 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        {/* Top Navbar with Brand Logo Button & Settings */}
        <Navbar
          user={user}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
          onResetToday={handleResetToday}
          isTodaySelected={selectedDate === getToday()}
          onOpenSettings={handleOpenSettings}
          isDark={isDark}
          onToggleDark={handleToggleDarkMode}
        />

        {/* OAuth Error Alert */}
        {oauthError && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs px-3.5 py-2.5 rounded-2xl mb-3.5 flex items-center justify-between shadow-sm">
            <span className="font-medium">⚠️ {oauthError}</span>
            <button
              type="button"
              onClick={() => setOauthError(null)}
              className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 font-bold ml-3 cursor-pointer"
            >
              닫기
            </button>
          </div>
        )}

        {/* Database Connection Error */}
        {dbError && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 text-xs px-3.5 py-2.5 rounded-2xl mb-3.5 flex items-center justify-between shadow-sm">
            <span className="font-medium">⚠️ {dbError}</span>
            <button
              type="button"
              onClick={() => loadSchedules(currentYearMonth)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 underline font-bold ml-3 flex-shrink-0 cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Header with Selected Date Progress (일정 진행 현황) */}
        <Header
          selectedDate={selectedDate}
          totalCount={totalCount}
          completedCount={completedCount}
          progressPercent={progressPercent}
        />

        {/* Not Logged In Callout */}
        {!user && !authLoading && (
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-700 dark:to-indigo-800 text-white rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 shadow-md shadow-indigo-200/50 dark:shadow-none flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3 text-left">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                  <span>나만의 비공개 캘린더</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                </h3>
                <p className="text-xs text-indigo-100 mt-0.5 leading-relaxed">
                  로그인하시면 나만 볼 수 있는 개인 일정을 안전하게 등록하고 관리할 수 있습니다.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAuth('login')}
              className="w-full sm:w-auto px-4 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>로그인하고 시작하기</span>
            </button>
          </div>
        )}

        {/* Schedule Input (일정 등록) */}
        <TodoInput
          onAdd={handleAddTodo}
          onOpenMulti={() => (user ? setMultiModalOpen(true) : handleOpenAuth('login'))}
          selectedDate={selectedDate}
          defaultPriority={settings.defaultPriority}
        />

        {/* Calendar View (캘린더) */}
        <CalendarView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          currentYearMonth={currentYearMonth}
          onChangeYearMonth={setCurrentYearMonth}
          monthlyScheduleCounts={monthlyCounts}
          startOfWeek={settings.startOfWeek}
        />

        {/* Filters & Sorting */}
        <TodoFilter
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          counts={{ total: totalCount, active: activeCount, completed: completedCount }}
        />

        {/* Selected Date Actions Header (선택된 날의 일정 모두 선택 바) */}
        {user && totalCount > 0 && (
          <div className="flex items-center justify-between px-1.5 pb-2 pt-0.5 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleAll}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95 ${
                  isAllCompleted
                    ? 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-slate-700'
                }`}
                title={isAllCompleted ? '선택된 날의 모든 일정 선택 해제' : '선택된 날의 모든 일정 선택'}
              >
                <CheckCheck className={`w-3.5 h-3.5 ${isAllCompleted ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
                <span>{isAllCompleted ? '선택 해제' : '모두 선택'}</span>
              </button>
              <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">
                {completedCount} / {totalCount}개 완료
              </span>
            </div>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleClearCompleted}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 transition-colors cursor-pointer bg-white/80 dark:bg-slate-900/80 shadow-2xs"
                title="완료(선택)된 항목 일괄 삭제"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>완료 항목 삭제 ({completedCount})</span>
              </button>
            )}
          </div>
        )}

        {/* Schedules List */}
        <main className="space-y-2.5">
          {!user ? (
            <div className="bg-white/70 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-bold text-sm mb-1">
                개인 일정이 보호되고 있습니다
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                소셜 로그인 또는 일반 회원가입 후 나만의 일정을 추가해보세요.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAuth('login')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>지금 로그인하기</span>
              </button>
            </div>
          ) : sortedTodos.length === 0 ? (
            <div className="bg-white/60 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">
                {search
                  ? `'${search}' 검색 결과가 없습니다.`
                  : `${selectedDate}에 등록된 일정이 없습니다.`}
              </p>
            </div>
          ) : (
            sortedTodos.map((todo, index) => (
              <TodoItem
                key={todo.id}
                index={index}
                todo={{
                  id: todo.id,
                  title: todo.title,
                  text: todo.title || todo.text,
                  description: todo.description,
                  completed: todo.completed,
                  priority: todo.priority,
                  date: todo.date,
                  createdAt: todo.date,
                }}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onOpenDetail={handleOpenDetail}
                isDraggable={Boolean(user)}
                onDragStart={handleDragStart}
                onDragOverItem={handleDragOverItem}
                onDragLeaveItem={handleDragLeaveItem}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                isDragging={draggedIndex === index}
                isDragOver={dragOverInfo?.index === index && draggedIndex !== index}
                dragOverPosition={dragOverInfo?.index === index ? dragOverInfo?.position : null}
              />
            ))
          )}
        </main>

        {/* Clear Completed Action (마지막 일정 바로 아래 배치) */}
        {user && completedCount > 0 && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleClearCompleted}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer bg-white/60 dark:bg-slate-900/60 shadow-2xs"
            >
              <CheckCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>완료 항목 삭제 ({completedCount})</span>
            </button>
          </div>
        )}

        {/* Footer Area with Copyright */}
        <footer className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800 text-center space-y-3 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-300">To-Do 캘린더</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">스마트한 개인 일정 관리 플래너</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              © {new Date().getFullYear()} To-Do 캘린더. All rights reserved.
            </p>
          </div>
        </footer>

        {/* Auth Modal (Login / Sign Up / Social) */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          initialMode={authModalMode}
        />

        {/* Multi / Recurring Schedule Modal */}
        <MultiScheduleModal
          isOpen={multiModalOpen}
          onClose={() => setMultiModalOpen(false)}
          initialDate={selectedDate}
          onSubmitBatch={handleBatchAddTodo}
        />

        {/* Schedule Detail & Memo Modal */}
        <TodoDetailModal
          isOpen={Boolean(selectedDetailTodo)}
          onClose={() => setSelectedDetailTodo(null)}
          todo={selectedDetailTodo}
          onSave={handleSaveDetail}
          onDelete={handleDelete}
          onToggle={handleDetailToggle}
        />

        {/* Settings & MyPage Modal */}
        <SettingsAndMyPageModal
          isOpen={settingsModalOpen}
          initialTab={settingsModalTab}
          onClose={() => setSettingsModalOpen(false)}
          user={user}
          onUserUpdated={handleUserUpdated}
          onLogout={handleLogout}
          onOpenAuth={handleOpenAuth}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onRefreshSchedules={() => loadSchedules(currentYearMonth)}
        />
      </div>
    </div>
  )
}
