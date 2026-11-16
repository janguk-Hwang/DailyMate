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
      const d = item.date
      if (!map[d]) map[d] = []
      map[d].push(item)
    })
    return map
  }, [allMonthTodos])

  const todayStr = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }, [])

  // 인라인 빠른 일정 추가
  const handleQuickAdd = (dateStr) => {
    if (!quickInputText.trim()) {
      setQuickInputDate(null)
      return
    }
    onAddTodo?.({
      title: quickInputText.trim(),
      date: dateStr,
      priority: 'medium'
    })
    setQuickInputText('')
    setQuickInputDate(null)
  }

  return (
    <div className="w-full h-full flex flex-col select-none no-scrollbar bg-transparent">
      {/* 1. Header Toolbar (DesktopCal 스타일 투명 유리 툴바) */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/20 dark:bg-black/35 backdrop-blur-md border-b border-white/15 text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              {year}년 {month}월
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="이전 달"
              className="p-1.5 rounded-lg text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              title="다음 달"
              className="p-1.5 rounded-lg text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoToday}
            className="px-2.5 py-1 text-xs font-bold rounded-lg text-white bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/30 transition cursor-pointer shadow-xs"
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
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-indigo-600/90 text-white rounded-lg hover:bg-indigo-600 transition cursor-pointer shadow-xs border border-indigo-400/30"
            >
              <Lock className="w-3 h-3" />
              <span>로그인하여 동기화</span>
            </button>
          ) : (
            <span className="text-[11px] text-white/70 font-medium hidden sm:inline drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
              날짜를 더블클릭하여 바로 일정을 추가할 수 있습니다
            </span>
          )}
        </div>
      </div>

      {/* 2. Weekday Header Grid (반투명 유리 요일 바) */}
      <div className="grid grid-cols-7 border-b border-white/15 bg-black/15 dark:bg-black/30 backdrop-blur-xs text-center text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
        {weekdays.map((wd, idx) => {
          const isSun = startOfWeek === 'monday' ? idx === 6 : idx === 0
          const isSat = startOfWeek === 'monday' ? idx === 5 : idx === 6
          return (
            <div
              key={wd}
              className={`py-1.5 border-r border-white/10 last:border-r-0 ${
                isSun
                  ? 'text-rose-400 font-extrabold'
                  : isSat
                  ? 'text-sky-400 font-extrabold'
                  : 'text-white/90'
              }`}
            >
              {wd}
            </div>
          )
        })}
      </div>

      {/* 3. Wallpaper Calendar Day Grid (DesktopCal 핵심: 바탕화면이 유리처럼 그대로 투과되는 대형 그리드) */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-hidden no-scrollbar bg-black/10 dark:bg-black/25 backdrop-blur-md">
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
              className={`min-h-[90px] p-1.5 border-b border-r border-white/15 last:border-r-0 flex flex-col justify-start transition-colors relative group ${
                cell.isCurrentMonth
                  ? 'bg-white/5 hover:bg-white/15 dark:bg-white/5 dark:hover:bg-white/10'
                  : 'bg-black/25 dark:bg-black/40 opacity-40'
              } ${isSelected ? 'ring-2 ring-indigo-400/90 inset-0 z-10 bg-white/10' : ''}`}
            >
              {/* Day Header (날짜 번호 & 추가 버튼) */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full transition-transform drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
                    isToday
                      ? 'bg-indigo-600 text-white shadow-md font-black'
                      : isSunCol
                      ? 'text-rose-400 font-extrabold'
                      : isSatCol
                      ? 'text-sky-400 font-extrabold'
                      : cell.isCurrentMonth
                      ? 'text-white'
                      : 'text-white/40'
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
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-white/80 hover:text-white bg-white/15 hover:bg-white/30 border border-white/20 transition-opacity cursor-pointer"
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
                    className="w-full px-1.5 py-1 text-[11px] bg-slate-900/90 text-white border border-indigo-400 rounded-md shadow-lg focus:outline-none font-medium placeholder-white/50"
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
                      className={`group/todo flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] leading-tight cursor-pointer transition-all select-none border ${
                        isCompleted
                          ? 'bg-black/25 text-white/50 border-white/5 line-through'
                          : 'bg-black/35 hover:bg-black/55 text-white border-white/15 backdrop-blur-xs shadow-2xs'
                      }`}
                    >
                      {/* Priority Dot */}
                      {!isCompleted && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            todo.priority === 'high'
                              ? 'bg-rose-400'
                              : todo.priority === 'low'
                              ? 'bg-emerald-400'
                              : 'bg-amber-400'
                          }`}
                        />
                      )}

                      {/* Checkmark Icon */}
                      {isCompleted ? (
                        <CheckCircle2 className="w-3 h-3 text-white/50 flex-shrink-0" />
                      ) : (
                        <Circle className="w-2.5 h-2.5 text-white/40 group-hover/todo:text-indigo-400 flex-shrink-0" />
                      )}

                      {/* Todo Title (취소선 지원) */}
                      <span className="truncate flex-1 font-medium drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
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
