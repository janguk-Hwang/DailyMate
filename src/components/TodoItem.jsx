import { useState } from 'react'
import { CheckCircle2, Circle, Trash2, Pencil, Check, X, GripVertical } from 'lucide-react'

export default function TodoItem({
  todo,
  index,
  onToggle,
  onDelete,
  onEdit,
  isDraggable = true,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
  isDragging = false,
  isDragOver = false,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)

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
      onDragEnter={(e) => onDragEnter && onDragEnter(index, e)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop && onDrop(index, e)}
      className={`group flex items-center gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl border transition-all duration-200 select-none ${
        isDragging
          ? 'opacity-40 scale-[0.98] border-indigo-400 bg-indigo-50/50 shadow-inner'
          : isDragOver
          ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-400/30'
          : todo.completed
          ? 'bg-slate-50/70 border-slate-200/60 opacity-75'
          : 'bg-white border-slate-200/90 shadow-xs hover:border-indigo-200'
      }`}
    >
      {/* Drag Handle */}
      {isDraggable && !isEditing ? (
        <div
          title="끌어서 순서 변경"
          className="text-slate-300 hover:text-indigo-600 group-hover:text-slate-400 p-0.5 -ml-1 cursor-grab active:cursor-grabbing transition-colors flex-shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      ) : null}

      {/* Completion Toggle Button */}
      <button
        type="button"
        onClick={() => onToggle(todo.id)}
        className="text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none flex-shrink-0 cursor-pointer"
        aria-label={todo.completed ? '미완료로 변경' : '완료로 변경'}
      >
        {todo.completed ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>

      {/* Content / Edit Form */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
              autoFocus
              className="w-full px-2.5 py-1 text-sm border border-indigo-400 rounded-lg focus:outline-none ring-2 ring-indigo-500/20"
            />
            <button
              type="button"
              onClick={handleSave}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title="저장"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="취소"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                onClick={() => onToggle(todo.id)}
                className={`text-sm font-medium cursor-pointer transition-all ${
                  todo.completed
                    ? 'line-through text-slate-400'
                    : 'text-slate-700 hover:text-indigo-600'
                }`}
              >
                {todo.text}
              </span>
              {getPriorityBadge(todo.priority)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {todo.createdAt}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons (Edit / Delete) */}
      {!isEditing && (
        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            title="수정"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(todo.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
