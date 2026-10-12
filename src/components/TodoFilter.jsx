import { Search, ArrowUpDown, ArrowDown, ArrowUp, GripVertical } from 'lucide-react'

export default function TodoFilter({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  counts,
}) {
  const handleToggleCreatedSort = () => {
    if (sortBy === 'created_desc') {
      onSortChange('created_asc')
    } else if (sortBy === 'created_asc') {
      onSortChange('created_desc')
    } else {
      onSortChange('created_desc')
    }
  }

  return (
    <section className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200/80 mb-3.5 sm:mb-4 space-y-2.5 sm:space-y-3">
      {/* Row 1: Status Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
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
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              filter === 'active'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            진행 ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('completed')}
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              filter === 'completed'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            완료 ({counts.completed})
          </button>
        </div>

        <div className="relative w-full sm:w-52">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="일정 검색..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 sm:py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 focus:bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              title="검색어 지우기"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Sort Order Filter */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 flex-shrink-0 mr-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
            <span>정렬:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-nowrap">
            {/* 우선순위 순 */}
            <button
              type="button"
              onClick={() => onSortChange('priority')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex-shrink-0 active:scale-95 ${
                sortBy === 'priority'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              우선순위 순
            </button>

            {/* 등록 순 (토글: 최신순 ↓ / 오래된순 ↑) */}
            <button
              type="button"
              onClick={handleToggleCreatedSort}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap flex-shrink-0 active:scale-95 ${
                sortBy === 'created_desc' || sortBy === 'created_asc'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              title={
                sortBy === 'created_desc'
                  ? '현재 최신 등록순 (클릭 시 오래된 순으로 전환)'
                  : sortBy === 'created_asc'
                  ? '현재 오래된 등록순 (클릭 시 최신 순으로 전환)'
                  : '등록 순 정렬'
              }
            >
              {sortBy === 'created_desc' ? (
                <>
                  <span>등록 순</span>
                  <ArrowDown className="w-3 h-3 text-indigo-200" />
                  <span className="text-[10px] text-indigo-200 font-normal">(최신)</span>
                </>
              ) : sortBy === 'created_asc' ? (
                <>
                  <span>등록 순</span>
                  <ArrowUp className="w-3 h-3 text-indigo-200" />
                  <span className="text-[10px] text-indigo-200 font-normal">(오래된)</span>
                </>
              ) : (
                <>
                  <span>등록 순</span>
                  <ArrowDown className="w-3 h-3 text-slate-400" />
                </>
              )}
            </button>

            {/* 드래그로 순서 변경 시 표시되는 직접 순서 알림 뱃지 (클릭 버튼 아님) */}
            {sortBy === 'custom' && (
              <span className="px-2 py-0.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-md flex items-center gap-1 whitespace-nowrap">
                <GripVertical className="w-3 h-3 text-indigo-500" />
                <span>직접 순서 적용됨</span>
              </span>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1 hidden sm:flex">
          <GripVertical className="w-3.5 h-3.5 text-slate-400" />
          <span>일정을 드래그하여 순서를 직접 바꿀 수 있습니다</span>
        </div>
      </div>
    </section>
  )
}
