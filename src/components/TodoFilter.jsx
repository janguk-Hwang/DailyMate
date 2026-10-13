import { Search, ArrowDown, ArrowUp, CheckCheck } from 'lucide-react'

export default function TodoFilter({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  counts,
  onToggleAll,
  isAllCompleted,
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
    <section className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-xs border border-slate-200/80 mb-3.5 sm:mb-4">
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-2.5">
        {/* 1. Status Filter Group (전체, 진행, 완료) */}
        <div className="flex bg-slate-100 p-0.5 sm:p-1 rounded-xl flex-shrink-0">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              filter === 'all'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            전체 ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('active')}
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              filter === 'active'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            진행 ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('completed')}
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              filter === 'completed'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            완료 ({counts.completed})
          </button>
        </div>

        {/* 2. Sort & Action Buttons Group (모두 선택, 우선순위 순, 등록 순) */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* 선택된 날의 일정 모두 선택 버튼 */}
          {onToggleAll && counts.total > 0 && (
            <button
              type="button"
              onClick={onToggleAll}
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap active:scale-95 ${
                isAllCompleted
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
              title={isAllCompleted ? '선택된 날의 모든 일정 선택 해제' : '선택된 날의 모든 일정 선택'}
            >
              <CheckCheck className={`w-3.5 h-3.5 ${isAllCompleted ? 'text-white' : 'text-indigo-600'}`} />
              <span>{isAllCompleted ? '선택 해제' : '모두 선택'}</span>
            </button>
          )}

          {/* 우선순위 순 */}
          <button
            type="button"
            onClick={() => onSortChange('priority')}
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              sortBy === 'priority'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            우선순위 순
          </button>

          {/* 등록 순 (토글: 최신순 ↓ / 오래된순 ↑) */}
          <button
            type="button"
            onClick={handleToggleCreatedSort}
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap active:scale-95 ${
              sortBy === 'created_desc' || sortBy === 'created_asc'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
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
                <ArrowDown className="w-3.5 h-3.5 text-indigo-200" />
                <span className="text-[10px] text-indigo-200 font-normal">(최신)</span>
              </>
            ) : sortBy === 'created_asc' ? (
              <>
                <span>등록 순</span>
                <ArrowUp className="w-3.5 h-3.5 text-indigo-200" />
                <span className="text-[10px] text-indigo-200 font-normal">(오래된)</span>
              </>
            ) : (
              <>
                <span>등록 순</span>
                <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
              </>
            )}
          </button>
        </div>

        {/* 3. Search Bar */}
        <div className="relative flex-1 min-w-[110px] sm:max-w-[170px] w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="일정 검색..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-7 py-1 sm:py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 focus:bg-white transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer text-xs"
              title="검색어 지우기"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
