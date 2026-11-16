import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Calendar as CalendarIcon,
  Sparkles,
  Lock,
  Trash2,
  CheckCircle2,
  Circle
} from 'lucide-react'

export default function DesktopWallpaperCalendar({
  currentYearMonth,
  onChangeYearMonth,
  selectedDate,
  onSelectDate,
  allMonthTodos = [],
  onToggleTodo,
  onAddTodo,
  onDeleteTodo,
  onOpenDetail,
  user,
  onOpenAuth,
  startOfWeek = 'sunday',
}) {
  const [year, month] = currentYearMonth.split('-').map(Number)
  const [quickInputDate, setQuickInputDate] = useState(null)
  const [quickInputText, setQuickInputText] = useState('')

  // 이전 달 / 다음 달 / 오늘 이동
  const handlePrevMonth = () => {
    let y = year, m = month - 1
    if (m < 1) { m = 12; y -= 1 }
    onChangeYearMonth(`${y}-${String(m).padStart(2, '0')}`)
  }

  const handleNextMonth = () => {
    let y = year, m = month + 1
    if (m > 12) { m = 1; y += 1 }
    onChangeYearMonth(`${y}-${String(m).padStart(2, '0')}`)
  }

  const handleGoToday = () => {
    const now = new Date()
    const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    onChangeYearMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    onSelectDate(dStr)
  }

  // 달력 그리드 계산
  const { weekdays, days } = useMemo(() => {
    const isMondayStart = startOfWeek === 'monday'
    const weekdaysBase = ['일', '월', '화', '수', '목', '금', '토']
    const weekdaysList = isMondayStart
      ? ['월', '화', '수', '목', '금', '토', '일']
      : weekdaysBase

    const firstDayDate = new Date(year, month - 1, 1)
    const firstDayIndex = firstDayDate.getDay()
    const lastDayOfMonth = new Date(year, month, 0).getDate()
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate()

    let emptyPrefix = isMondayStart ? (firstDayIndex === 0 ? 6 : firstDayIndex - 1) : firstDayIndex

    const dayCells = []

    // 이전 달 일자 채우기
    for (let i = emptyPrefix - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i
      let pm = month - 1, py = year
      if (pm < 1) { pm = 12; py -= 1 }
      const fullDate = `${py}-${String(pm).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`
      dayCells.push({ dayNumber: dNum, fullDate, isCurrentMonth: false })
    }

    // 이번 달 일자 채우기
    for (let d = 1; d <= lastDayOfMonth; d++) {
      const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      dayCells.push({ dayNumber: d, fullDate, isCurrentMonth: true })
    }

    // 7의 배수로 다음 달 일자 채우기 (최소 35칸, 필요시 42칸)
    const totalSlots = Math.ceil(dayCells.length / 7) * 7
    const remaining = totalSlots - dayCells.length
    for (let d = 1; d <= remaining; d++) {
      let nm = month + 1, ny = year
      if (nm > 12) { nm = 1; ny += 1 }
      const fullDate = `${ny}-${String(nm).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      dayCells.push({ dayNumber: d, fullDate, isCurrentMonth: false })
    }

    return { weekdays: weekdaysList, days: dayCells }
  }, [year, month, startOfWeek])

  // 날짜별 일정 매핑
  const todosByDate = useMemo(() => {
    const map = {}
    allMonthTodos.forEach((item) => {
      if (!map[item.date]) map[item.date] = []
      map[item.date].push(item)
    })
    return map
  }, [allMonthTodos])

  const todayStr = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }, [])

  // 빠른 일정 추가 핸들러
  const handleQuickAdd = (dateStr) => {
    if (!quickInputText.trim()) {
      setQuickInputDate(null)
      return
    }
    onAddTodo(quickInputText.trim(), 'medium', dateStr)
    setQuickInputText('')
    setQuickInputDate(null)
  }

  return (
    <div className="w-full h-full flex flex-col select-none no-scrollbar">
      {/* 1. Header Toolbar (DesktopCal 스타일 툴바) */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-white/20 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {year}년 {month}월
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="이전 달"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              title="다음 달"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoToday}
            className="px-2.5 py-1 text-xs font-bold rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer"
          >
            오늘
          </button>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-2">
          {!user ? (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer shadow-xs"
            >
              <Lock className="w-3 h-3" />
              <span>로그인하여 동기화</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              날짜를 더블클릭하여 바로 일정을 추가할 수 있습니다
            </span>
          )}
        </div>
      </div>

      {/* 2. Weekday Header Grid */}
      <div className="grid grid-cols-7 border-b border-white/20 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs text-center text-xs font-bold">
        {weekdays.map((wd, idx) => {
          const isSun = startOfWeek === 'monday' ? idx === 6 : idx === 0
          const isSat = startOfWeek === 'monday' ? idx === 5 : idx === 6
          return (
            <div
              key={wd}
              className={`py-1.5 border-r border-white/10 dark:border-slate-800/60 last:border-r-0 ${
                isSun
                  ? 'text-rose-500'
                  : isSat
                  ? 'text-blue-500'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {wd}
            </div>
          )
        })}
      </div>

      {/* 3. Wallpaper Calendar Day Grid (DesktopCal 핵심 대형 그리드) */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-hidden no-scrollbar bg-slate-900/10 dark:bg-black/30 backdrop-blur-md">
        {days.map((cell, idx) => {
          const cellTodos = todosByDate[cell.fullDate] || []
          const isToday = cell.fullDate === todayStr
          const isSelected = cell.fullDate === selectedDate
          const isSunCol = startOfWeek === 'monday' ? idx % 7 === 6 : idx % 7 === 0
          const isSatCol = startOfWeek === 'monday' ? idx % 7 === 5 : idx % 7 === 6

          return (
            <div
              key={cell.fullDate}
              onClick={() => onSelectDate(cell.fullDate)}
              onDoubleClick={() => {
                if (user) {
                  setQuickInputDate(cell.fullDate)
                } else {
                  onOpenAuth?.()
                }
              }}
              className={`min-h-[90px] p-1.5 border-b border-r border-white/15 dark:border-slate-800/60 last:border-r-0 flex flex-col justify-start transition-colors relative group ${
                cell.isCurrentMonth
                  ? 'bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-800/60'
                  : 'bg-white/15 dark:bg-slate-950/30 opacity-60'
              } ${isSelected ? 'ring-2 ring-indigo-500/60 inset-0 z-10' : ''}`}
            >
              {/* Day Header (날짜 번호 & 추가 버튼) */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full transition-transform ${
                    isToday
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : isSunCol
                      ? 'text-rose-500'
                      : isSatCol
                      ? 'text-blue-500'
                      : cell.isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {/* Hover Quick Add Button (+) */}
                {user && cell.isCurrentMonth && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setQuickInputDate(cell.fullDate)
                    }}
                    title="이 날짜에 새 일정 추가"
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-500 hover:text-indigo-600 hover:bg-white/80 dark:hover:bg-slate-800 transition-opacity cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Input Bar (더블클릭 또는 + 클릭 시 인라인 입력) */}
              {quickInputDate === cell.fullDate && (
                <div
                  className="mb-1.5 z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="새 일정 입력 후 엔터"
                    value={quickInputText}
                    onChange={(e) => setQuickInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAdd(cell.fullDate)
                      if (e.key === 'Escape') setQuickInputDate(null)
                    }}
                    onBlur={() => handleQuickAdd(cell.fullDate)}
                    className="w-full px-1.5 py-1 text-[11px] bg-white dark:bg-slate-800 border border-indigo-500 rounded shadow-md focus:outline-none font-medium text-slate-800 dark:text-slate-100"
                  />
                </div>
              )}

              {/* Day Todos List (DesktopCal 핵심: 일정 목록 + 완료 시 취소선) */}
              <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar max-h-[120px]">
                {cellTodos.map((todo) => {
                  const isCompleted = todo.completed

                  return (
                    <div
                      key={todo.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleTodo?.(todo.id)
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        onOpenDetail?.(todo)
                      }}
                      title={`${todo.title || todo.text} (더블클릭 시 상세/수정)`}
                      className={`group/todo flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] leading-tight cursor-pointer transition-all select-none ${
                        isCompleted
                          ? 'bg-slate-200/40 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 line-through'
                          : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      {/* Priority Dot */}
                      {!isCompleted && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            todo.priority === 'high'
                              ? 'bg-rose-500'
                              : todo.priority === 'low'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                        />
                      )}

                      {/* Checkmark Icon */}
                      {isCompleted ? (
                        <CheckCircle2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-2.5 h-2.5 text-slate-300 dark:text-slate-600 group-hover/todo:text-indigo-500 flex-shrink-0" />
                      )}

                      {/* Todo Title (취소선 지원) */}
                      <span className="truncate flex-1 font-medium">
                        {todo.title || todo.text}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
