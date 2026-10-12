import { Calendar, CheckSquare, LogIn, LogOut, User, UserPlus } from 'lucide-react'

export default function Header({
  selectedDate,
  totalCount,
  completedCount,
  progressPercent,
  user,
  onOpenAuth,
  onLogout,
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

  const getProviderBadge = (provider) => {
    switch (provider) {
      case 'kakao':
        return <span className="px-2 py-0.5 text-[10px] bg-yellow-100 text-yellow-800 font-semibold rounded-md">카카오</span>
      case 'google':
        return <span className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-700 font-semibold rounded-md">Google</span>
      case 'naver':
        return <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-semibold rounded-md">네이버</span>
      default:
        return <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 font-semibold rounded-md">일반</span>
    }
  }

  return (
    <header className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200/80 mb-6">
      {/* Top Bar: Title & User Profile / Login */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200 flex-shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              일정 관리 (Daily Schedule)
            </h1>
            <p className="text-xs text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate} 일정
            </p>
          </div>
        </div>

        {/* User Status Section */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {user ? (
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">{user.name || user.username}</span>
                  {getProviderBadge(user.provider)}
                </div>
                {user.username && (
                  <span className="text-[11px] text-slate-400 font-mono">@{user.username}</span>
                )}
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="로그아웃"
                className="ml-1 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>로그인</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>회원가입</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress & Stats */}
      <div className="mt-5">
        <div className="flex justify-between items-center mb-1.5">
          <div className="text-xs text-slate-500 font-medium">
            <span>{formattedDate} 진행 상황</span>
            <span className="ml-2 font-semibold text-slate-700">({completedCount} / {totalCount} 완료)</span>
          </div>
          <div className="text-sm font-extrabold text-indigo-600">
            {progressPercent}%
          </div>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </header>
  )
}
