import { Search, ArrowDown, ArrowUp } from 'lucide-react'

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
    <section className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:p-3 shadow-xs border border-slate-200/80 dark:border-slate-800 mb-3.5 sm:mb-4 transition-colors">
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-2.5">
        {/* 1. Status Filter Group (전체, 진행, 완료) */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl flex-shrink-0">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            전체 ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('active')}
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              filter === 'active'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            진행 ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('completed')}
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              filter === 'completed'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            완료 ({counts.completed})
          </button>
        </div>

        {/* 2. Sort Buttons Group (우선순위 순, 등록 순) */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* 우선순위 순 */}
          <button
            type="button"
            onClick={() => onSortChange('priority')}
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              sortBy === 'priority'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
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
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
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
            className="w-full pl-8 pr-7 py-1 sm:py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer text-xs"
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
