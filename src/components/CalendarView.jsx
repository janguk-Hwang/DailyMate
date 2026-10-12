import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

export default function CalendarView({
  selectedDate,
  onSelectDate,
  currentYearMonth,
  onChangeYearMonth,
  monthlyScheduleCounts = {},
}) {
  const [year, month] = currentYearMonth.split('-').map(Number)

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

  const firstDay = new Date(year, month - 1, 1).getDay()
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

  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-sm border border-slate-200/80 mb-4 sm:mb-6">
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

      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {weekdays.map((wd, i) => (
          <div
            key={wd}
            className={`text-[11px] sm:text-xs font-semibold py-0.5 sm:py-1 ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-400'
            }`}
          >
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((item, idx) => {
          if (!item.current) {
            return (
              <div
                key={idx}
                className="h-11 sm:h-13 flex items-start justify-center p-0.5 sm:p-1 text-[11px] sm:text-xs text-slate-300"
              >
                {item.day}
              </div>
            )
          }

          const isSelected = item.dateStr === selectedDate
          const isToday = item.dateStr === todayStr
          const dow = idx % 7
          const stats = monthlyScheduleCounts[item.dateStr]
          const count = stats?.total || 0
          const comp = stats?.completed || 0

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(item.dateStr)}
              className={`h-11 sm:h-13 flex flex-col items-center justify-between p-0.5 sm:p-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200'
                  : 'hover:bg-indigo-50/70 text-slate-700'
              } ${isToday && !isSelected ? 'ring-2 ring-indigo-400' : ''}`}
            >
              <span
                className={`text-[11px] sm:text-xs leading-tight ${
                  isSelected
                    ? 'text-white'
                    : dow === 0
                    ? 'text-red-500'
                    : dow === 6
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
  )
}
