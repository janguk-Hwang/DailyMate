import { Calendar, CheckSquare, LogIn, LogOut, User, UserPlus, Sparkles } from 'lucide-react'

export default function Navbar({
  user,
  onOpenAuth,
  onLogout,
  onResetToday,
  isTodaySelected,
}) {
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
    <nav className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 mb-5 flex items-center justify-between transition-all">
      {/* Left: Brand Logo Button */}
      <button
        type="button"
        onClick={onResetToday}
        title="홈 (오늘 일정으로 이동)"
        className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 group-hover:shadow-indigo-300 transition-all duration-200">
          <CheckSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
              To-Do 캘린더
            </span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded-md">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            나만의 스마트한 개인 일정 플래너
          </p>
        </div>
      </button>

      {/* Right: Quick Today Jump & User Profile / Login */}
      <div className="flex items-center gap-2 sm:gap-3">
        {!isTodaySelected && (
          <button
            type="button"
            onClick={onResetToday}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>오늘</span>
          </button>
        )}

        {user ? (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-left max-w-[120px] sm:max-w-[160px] truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {user.name || user.username}
                </span>
                {getProviderBadge(user.provider)}
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="로그아웃"
              className="ml-1 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>로그인</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>회원가입</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
