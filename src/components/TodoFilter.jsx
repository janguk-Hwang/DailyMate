import { Search, ArrowUpDown, GripVertical, SlidersHorizontal } from 'lucide-react'

export default function TodoFilter({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  counts,
}) {
  return (
    <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-4 space-y-3">
      {/* Row 1: Status Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            전체 ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('active')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'active'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            진행 중 ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('completed')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'completed'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            완료 ({counts.completed})
          </button>
        </div>

        <div className="relative w-full sm:w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="일정 검색..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Row 2: Sort Order Filter & Drag Tip */}
      <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 flex-shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
            <span>정렬 기준:</span>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => onSortChange('custom')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                sortBy === 'custom'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <GripVertical className="w-3 h-3" />
              <span>직접 순서 (드래그)</span>
            </button>

            <button
              type="button"
              onClick={() => onSortChange('priority')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                sortBy === 'priority'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              우선순위 순
            </button>

            <button
              type="button"
              onClick={() => onSortChange('created_desc')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                sortBy === 'created_desc'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              최신 등록 순
            </button>

            <button
              type="button"
              onClick={() => onSortChange('created_asc')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                sortBy === 'created_asc'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              오래된 등록 순
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1 hidden sm:flex">
          <GripVertical className="w-3.5 h-3.5 text-slate-400" />
          <span>왼쪽 손잡이를 잡고 끌어서 순서를 변경하세요</span>
        </div>
      </div>
    </section>
  )
}
