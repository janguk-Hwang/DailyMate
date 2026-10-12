import { useState } from 'react'
import { Plus, CalendarDays } from 'lucide-react'

export default function TodoInput({ onAdd, onOpenMulti, selectedDate }) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('medium')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text.trim(), priority)
    setText('')
  }

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder={`${selectedDate || '선택한 날짜'}에 등록할 일정을 입력하세요...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
        />
        <div className="flex gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="high">우선순위: 높음</option>
            <option value="medium">우선순위: 보통</option>
            <option value="low">우선순위: 낮음</option>
          </select>
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>등록</span>
          </button>
          {onOpenMulti && (
            <button
              type="button"
              onClick={onOpenMulti}
              title="기간 일정, 매주 요일 반복, 여러 날짜 동시 등록"
              className="flex items-center justify-center gap-1 px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold border border-indigo-200 transition-colors cursor-pointer flex-shrink-0"
            >
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">기간/반복</span>
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
