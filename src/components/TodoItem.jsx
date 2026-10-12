import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Trash2, Pencil, Check, X, GripVertical } from 'lucide-react'

export default function TodoItem({
  todo,
  index,
  onToggle,
  onDelete,
  onEdit,
  isDraggable = true,
  onDragStart,
  onDragOverItem,
  onDragLeaveItem,
  onDragEnd,
  onDrop,
  isDragging = false,
  isDragOver = false,
  dragOverPosition = null, // 'top' | 'bottom'
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)

  useEffect(() => {
    if (!isEditing) {
      setEditText(todo.text)
    }
  }, [todo.text, isEditing])

  const handleStartEdit = () => {
    setEditText(todo.text)
    setIsEditing(true)
  }

  const handleSave = () => {
    const trimmed = editText.trim()
    if (!trimmed) return
    onEdit(todo.id, trimmed)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(todo.text)
    setIsEditing(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!isDraggable || isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const offset = e.clientY - rect.top
    const position = offset < rect.height / 2 ? 'top' : 'bottom'
    onDragOverItem && onDragOverItem(index, position)
  }

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      onDragLeaveItem && onDragLeaveItem(index)
    }
  }

  const handleDropInternal = (e) => {
    e.preventDefault()
    if (!isDraggable || isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const offset = e.clientY - rect.top
    const position = offset < rect.height / 2 ? 'top' : 'bottom'
    onDrop && onDrop(index, position)
  }

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-700">
            높음
          </span>
        )
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-700">
            보통
          </span>
        )
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-700">
            낮음
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div
      draggable={!isEditing && isDraggable}
      onDragStart={(e) => onDragStart && onDragStart(index, e)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={onDragEnd}
      onDrop={handleDropInternal}
      className={`relative transition-all duration-150 ${
        isDragging ? 'opacity-30 scale-[0.98]' : ''
      }`}
    >
      {/* Top Insertion Slot (위쪽 일정 사이를 비집고 들어가는 슬롯 효과) */}
      {isDragOver && dragOverPosition === 'top' && (
        <div className="py-1 my-0.5 transition-all duration-200">
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-500 rounded-full shadow-sm shadow-indigo-300 flex items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-white shadow-sm -ml-0.5" />
          </div>
          <div className="h-7 bg-indigo-50/80 border-2 border-dashed border-indigo-300 rounded-xl mt-1 flex items-center justify-center gap-1.5 transition-all">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-[10px] font-bold text-indigo-700 tracking-tight">
              여기에 일정 삽입
            </span>
          </div>
        </div>
      )}

      {/* Todo Card */}
      <div
        className={`group flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border transition-all duration-200 select-none ${
          isDragging
            ? 'border-dashed border-indigo-300 bg-slate-50 shadow-inner'
            : todo.completed
            ? 'bg-slate-50/70 border-slate-200/60 opacity-80'
            : 'bg-white border-slate-200/90 shadow-xs hover:border-indigo-200'
        }`}
      >
        {/* Drag Handle */}
        {isDraggable && !isEditing ? (
          <div
            title="끌어서 순서 변경"
            className="text-slate-300 hover:text-indigo-600 sm:group-hover:text-slate-400 w-5 h-7 flex items-center justify-center -ml-1 cursor-grab active:cursor-grabbing transition-colors flex-shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        ) : null}

        {/* Completion Toggle Button */}
        <button
          type="button"
          onClick={() => onToggle(todo.id)}
          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none flex-shrink-0 cursor-pointer active:scale-90"
          aria-label={todo.completed ? '미완료로 변경' : '완료로 변경'}
        >
          {todo.completed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        {/* Content / Edit Form */}
        <div className="flex-1 min-w-0 pr-1">
          {isEditing ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
                autoFocus
                className="w-full px-2.5 py-1.5 text-sm border border-indigo-400 rounded-lg focus:outline-none ring-2 ring-indigo-500/20 bg-white"
              />
              <button
                type="button"
                onClick={handleSave}
                className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                title="저장"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                title="취소"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span
                  onClick={() => onToggle(todo.id)}
                  className={`text-sm font-medium cursor-pointer transition-all break-words break-all leading-snug ${
                    todo.completed
                      ? 'line-through text-slate-400'
                      : 'text-slate-700 hover:text-indigo-600'
                  }`}
                >
                  {todo.text}
                </span>
                {getPriorityBadge(todo.priority)}
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 block">
                {todo.createdAt}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons (Edit / Delete) */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              type="button"
              onClick={handleStartEdit}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer active:scale-90"
              title="수정"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(todo.id)}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer active:scale-90"
              title="삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Insertion Slot (아래쪽 일정 사이를 비집고 들어가는 슬롯 효과) */}
      {isDragOver && dragOverPosition === 'bottom' && (
        <div className="py-1 my-0.5 transition-all duration-200">
          <div className="h-7 bg-indigo-50/80 border-2 border-dashed border-indigo-300 rounded-xl mb-1 flex items-center justify-center gap-1.5 transition-all">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-[10px] font-bold text-indigo-700 tracking-tight">
              여기에 일정 삽입
            </span>
          </div>
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-500 rounded-full shadow-sm shadow-indigo-300 flex items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-white shadow-sm -ml-0.5" />
          </div>
        </div>
      )}
    </div>
  )
}
