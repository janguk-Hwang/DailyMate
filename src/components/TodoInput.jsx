import { useState, useEffect } from 'react'
import { Plus, CalendarDays } from 'lucide-react'

export default function TodoInput({ onAdd, onOpenMulti, selectedDate, defaultPriority = 'medium' }) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState(defaultPriority)

  useEffect(() => {
    setPriority(defaultPriority)
  }, [defaultPriority])

  const titleList = text
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (titleList.length === 0) return
    onAdd(titleList, priority)
    setText('')
  }

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-4 sm:mb-6 transition-colors">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder={`${selectedDate || '선택한 날짜'}에 등록할 일정 입력 ( , 로 구분)`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all bg-slate-50/50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800"
          />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="px-2.5 sm:px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer flex-shrink-0"
            >
              <option value="high">높음 🔴</option>
              <option value="medium">보통 🟡</option>
              <option value="low">낮음 🟢</option>
            </select>

            <button
              type="submit"
              disabled={titleList.length === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3.5 sm:px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{titleList.length > 1 ? `${titleList.length}개 등록` : '등록'}</span>
            </button>

            {onOpenMulti && (
              <button
                type="button"
                onClick={onOpenMulti}
                title="기간 일정, 매주 요일 반복, 여러 날짜 동시 등록"
                className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer flex-shrink-0"
              >
                <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>기간/반복</span>
              </button>
            )}
          </div>
        </div>

        {titleList.length > 1 && (
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-medium px-1">
            <span>💡 쉼표(,) 구분 {titleList.length}개 일정 인식:</span>
            <span className="text-slate-600 font-normal truncate">
              {titleList.join(' • ')}
            </span>
          </div>
        )}
      </form>
    </section>
  )
}
