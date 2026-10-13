import { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  CheckCircle2,
  Circle,
  Trash2,
  Check,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react'

export default function TodoDetailModal({
  isOpen,
  onClose,
  todo,
  onSave,
  onDelete,
  onToggle,
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (todo && isOpen) {
      setTitle(todo.title || todo.text || '')
      setDescription(todo.description || '')
      setPriority(todo.priority || 'medium')
    }
  }, [todo, isOpen])

  if (!isOpen || !todo) return null

  const handleSave = async (e) => {
    e?.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      alert('일정 제목을 입력해주세요.')
      return
    }

    try {
      setIsSaving(true)
      await onSave(todo.id, {
        title: trimmedTitle,
        description: description.trim(),
        priority,
      })
      onClose()
    } catch (err) {
      alert(err.message || '일정 수정에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`'${todo.title || todo.text}' 일정을 삭제하시겠습니까?`)) return
    try {
      await onDelete(todo.id)
      onClose()
    } catch (err) {
      alert(err.message || '일정 삭제 실패')
    }
  }

  const formattedDate = (() => {
    try {
      const dStr = todo.date || todo.createdAt
      if (!dStr) return ''
      const [y, m, d] = dStr.split('-').map(Number)
      const dateObj = new Date(y, m - 1, d)
      return dateObj.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    } catch {
      return todo.date || todo.createdAt || ''
    }
  })()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transition-all flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white relative flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="닫기 (ESC)"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-indigo-200" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              일정 상세 및 메모
            </h2>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-indigo-100">
            <span className="flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-indigo-200" />
              <span>{formattedDate}</span>
            </span>

            <button
              type="button"
              onClick={() => onToggle && onToggle(todo.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                todo.completed
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-white/20 text-indigo-100 hover:bg-white/30'
              }`}
            >
              {todo.completed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>완료됨</span>
                </>
              ) : (
                <>
                  <Circle className="w-3.5 h-3.5" />
                  <span>진행 중</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              일정 제목 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="일정 제목을 입력하세요"
              className="w-full px-3.5 sm:px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
              required
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">우선순위</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  priority === 'high'
                    ? 'bg-rose-50 border-rose-400 text-rose-700 ring-2 ring-rose-400/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🔴</span>
                <span>높음</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  priority === 'medium'
                    ? 'bg-amber-50 border-amber-400 text-amber-700 ring-2 ring-amber-400/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🟡</span>
                <span>보통</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  priority === 'low'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-2 ring-emerald-400/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🟢</span>
                <span>낮음</span>
              </button>
            </div>
          </div>

          {/* Detailed Content / Memo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>상세 내용 및 메모</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {description.length}자
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="일정에 필요한 준비물, 장소, 링크, 세부 내용 등을 자유롭게 메모해보세요... (줄바꿈 가능)"
              rows={6}
              className="w-full px-3.5 sm:px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-700 resize-none leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              💡 메모를 입력해두면 일정 카드에 메모 아이콘이 표시되어 쉽게 확인할 수 있습니다.
            </p>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
          >
            <Trash2 className="w-4 h-4" />
            <span>삭제</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? '저장 중...' : '저장하기'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
