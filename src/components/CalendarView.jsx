import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

export default function CalendarView({
  selectedDate,
  onSelectDate,
  currentYearMonth,
  onChangeYearMonth,
  monthlyScheduleCounts = {},
  startOfWeek = 'sunday',
}) {
  const [year, month] = currentYearMonth.split('-').map(Number)

  // Drag / Swipe States
  const [dragStartX, setDragStartX] = useState(null)
  const [dragStartY, setDragStartY] = useState(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const minSwipeThreshold = 80

  const prevMonthNum = month === 1 ? 12 : month - 1
  const nextMonthNum = month === 12 ? 1 : month + 1

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

  // Touch Swipe Handlers (Mobile / Tablet)
  const handleTouchStart = (e) => {
    setDragStartX(e.targetTouches[0].clientX)
    setDragStartY(e.targetTouches[0].clientY)
    setDragOffset(0)
    setIsSwiping(true)
  }

  const handleTouchMove = (e) => {
    if (dragStartX === null) return
    const currentX = e.targetTouches[0].clientX
    const currentY = e.targetTouches[0].clientY
    const diffX = currentX - dragStartX
    const diffY = currentY - (dragStartY || currentY)

    // Detect predominantly horizontal movement
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setDragOffset(diffX)
    }
  }

  const handleTouchEnd = () => {
    if (Math.abs(dragOffset) >= minSwipeThreshold) {
      if (dragOffset > 0) {
        handlePrevMonth()
      } else {
        handleNextMonth()
      }
    }
    setDragStartX(null)
    setDragStartY(null)
    setDragOffset(0)
    setIsSwiping(false)
  }

  // Mouse Drag Handlers (Desktop)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    setDragStartX(e.clientX)
    setDragStartY(e.clientY)
    setDragOffset(0)
    setIsSwiping(true)
  }

  const handleMouseMove = (e) => {
    if (!isSwiping || dragStartX === null) return
    const diffX = e.clientX - dragStartX
    setDragOffset(diffX)
  }

  const handleMouseUp = () => {
    if (!isSwiping) return
    if (Math.abs(dragOffset) >= minSwipeThreshold) {
      if (dragOffset > 0) {
        handlePrevMonth()
      } else {
        handleNextMonth()
      }
    }
    setDragStartX(null)
    setDragStartY(null)
    setDragOffset(0)
    setIsSwiping(false)
  }

  const handleDateClick = (dateStr) => {
    // Ignore click if user was swiping/dragging horizontally
    if (Math.abs(dragOffset) > 8) return
    onSelectDate(dateStr)
  }

  const isMondayStart = startOfWeek === 'monday'
  const rawFirstDay = new Date(year, month - 1, 1).getDay()
  const firstDay = isMondayStart ? (rawFirstDay + 6) % 7 : rawFirstDay
  const totalDays = new Date(year, month, 0).getDate()
  const prevTotal = new Date(year, month - 1, 0).getDate()

  const todayStr = (() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  })()

  const days = []
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevTotal - i, dateStr: null, current: false })
  }
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ day: d, dateStr, current: true })
  }
  const remaining = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, dateStr: null, current: false })
  }

  const weekdays = isMondayStart
    ? ['월', '화', '수', '목', '금', '토', '일']
    : ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-sm border border-slate-200/80 mb-4 sm:mb-6">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-3.5 sm:mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {year}년 {month}월
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleGoToday}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            오늘
          </button>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-600 border-l border-slate-200 transition-colors cursor-pointer"
              title="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Swipeable Calendar Body Container */}
      <div
        className="relative overflow-hidden select-none cursor-grab active:cursor-grabbing touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Swipe Feedback Overlay Indicator */}
        {isSwiping && Math.abs(dragOffset) >= 35 && (
          <div
            className={`absolute inset-x-0 top-0 bottom-0 z-20 pointer-events-none flex items-center ${
              dragOffset > 0 ? 'justify-start pl-3' : 'justify-end pr-3'
            }`}
          >
            <div
              className={`font-bold text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-1.5 transition-all duration-150 ${
                Math.abs(dragOffset) >= minSwipeThreshold
                  ? 'bg-indigo-600 text-white scale-105 shadow-indigo-500/30'
                  : 'bg-slate-700/70 text-slate-200 opacity-80'
              }`}
            >
              {dragOffset > 0 ? (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>
                    {Math.abs(dragOffset) >= minSwipeThreshold
                      ? `${prevMonthNum}월로 이동`
                      : `${prevMonthNum}월`}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {Math.abs(dragOffset) >= minSwipeThreshold
                      ? `${nextMonthNum}월로 이동`
                      : `${nextMonthNum}월`}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </div>
          </div>
        )}

        {/* Days & Grid with Elastic Translation */}
        <div
          style={{
            transform: `translateX(${dragOffset * 0.35}px)`,
            transition: isSwiping ? 'none' : 'transform 200ms ease-out',
          }}
        >
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {weekdays.map((wd, i) => {
              const isSunday = isMondayStart ? i === 6 : i === 0
              const isSaturday = isMondayStart ? i === 5 : i === 6
              return (
                <div
                  key={wd}
                  className={`text-[11px] sm:text-xs font-semibold py-0.5 sm:py-1 ${
                    isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-slate-400'
                  }`}
                >
                  {wd}
                </div>
              )
            })}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((item, idx) => {
              if (!item.current) {
                const col = idx % 7
                const isSunCol = isMondayStart ? col === 6 : col === 0
                const isSatCol = isMondayStart ? col === 5 : col === 6
                return (
                  <div
                    key={idx}
                    className={`h-11 sm:h-13 flex items-start justify-center p-0.5 sm:p-1 text-[11px] sm:text-xs select-none ${
                      isSunCol ? 'text-red-200' : isSatCol ? 'text-blue-200' : 'text-slate-300'
                    }`}
                  >
                    {item.day}
                  </div>
                )
              }

              const isSelected = item.dateStr === selectedDate
              const isToday = item.dateStr === todayStr
              const dayOfWeek = item.dateStr ? new Date(`${item.dateStr}T00:00:00`).getDay() : null
              const isSunday = dayOfWeek === 0
              const isSaturday = dayOfWeek === 6
              const stats = monthlyScheduleCounts[item.dateStr]
              const count = stats?.total || 0
              const comp = stats?.completed || 0

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDateClick(item.dateStr)}
                  className={`h-11 sm:h-13 flex flex-col items-center justify-between p-0.5 sm:p-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200'
                      : 'hover:bg-indigo-50/70 text-slate-700'
                  } ${isToday && !isSelected ? 'ring-2 ring-indigo-400' : ''}`}
                >
                  <span
                    className={`text-[11px] sm:text-xs leading-tight font-medium ${
                      isSelected
                        ? 'text-white'
                        : isSunday
                        ? 'text-red-500'
                        : isSaturday
                        ? 'text-blue-500'
                        : ''
                    }`}
                  >
                    {item.day}
                  </span>

                  <div className="h-4 flex items-center justify-center w-full">
                    {count > 0 && (
                      <span
                        className={`px-1 sm:px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-medium leading-none truncate max-w-full ${
                          isSelected
                            ? 'bg-white text-indigo-700 font-bold'
                            : comp === count
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {comp}/{count}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Swipe Guide Caption */}
      <div className="text-[10px] text-slate-400 text-center mt-2.5 flex items-center justify-center gap-1 select-none">
        <ChevronLeft className="w-3 h-3 text-slate-300" />
        <span>좌우로 드래그(스와이프)하여 월을 변경할 수 있습니다</span>
        <ChevronRight className="w-3 h-3 text-slate-300" />
      </div>
    </div>
  )
}
