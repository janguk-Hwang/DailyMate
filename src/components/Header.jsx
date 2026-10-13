import { Calendar, CheckSquare } from 'lucide-react'

export default function Header({
  selectedDate,
  totalCount,
  completedCount,
  progressPercent,
}) {
  const formattedDate = (() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number)
      const dateObj = new Date(y, m - 1, d)
      return dateObj.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    } catch {
      return selectedDate
    }
  })()

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-4 sm:mb-6 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="p-2.5 sm:p-3 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200 dark:shadow-none flex-shrink-0">
            <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              일정 진행 현황
            </h2>
            <p className="text-[11px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {progressPercent}%
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">달성률</div>
        </div>
      </div>

      <div className="mt-3.5 sm:mt-5">
        <div className="flex justify-between items-center mb-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>{formattedDate} 진행 상황</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">({completedCount} / {totalCount} 완료)</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 sm:h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </header>
  )
}
