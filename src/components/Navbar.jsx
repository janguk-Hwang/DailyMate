import { Calendar, CheckSquare, LogIn, LogOut, User, UserPlus, Settings as SettingsIcon, Sun, Moon } from 'lucide-react'

export default function Navbar({
  user,
  onOpenAuth,
  onLogout,
  onResetToday,
  isTodaySelected,
  onOpenSettings,
  isDark = false,
  onToggleDark,
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
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 sm:p-5 shadow-xs border border-slate-200/80 dark:border-slate-800 mb-3.5 sm:mb-5 flex items-center justify-between transition-colors">
      {/* Left: Brand Logo Button */}
      <button
        type="button"
        onClick={onResetToday}
        title="홈 (오늘 일정으로 이동)"
        className="flex items-center gap-2 sm:gap-3 group text-left cursor-pointer focus:outline-none"
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none group-hover:scale-105 transition-all duration-200 flex-shrink-0">
          <CheckSquare className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              DailyMate
            </span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-md">
              v1.1
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            나만의 스마트한 개인 일정 플래너
          </p>
        </div>
      </button>

      {/* Right: Quick Today Jump, Dark Toggle, Settings & User Profile / Login */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {!isTodaySelected && (
          <button
            type="button"
            onClick={onResetToday}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-xl transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>오늘</span>
          </button>
        )}

        {/* Quick Dark Mode Toggle Button */}
        {onToggleDark && (
          <button
            type="button"
            onClick={onToggleDark}
            title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        )}

        {/* Global Settings Gear Button */}
        <button
          type="button"
          onClick={() => onOpenSettings('settings')}
          title="환경설정"
          className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        {user ? (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => onOpenSettings('profile')}
              title="마이페이지 & 통계 열기"
              className="flex items-center gap-1.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:scale-105 transition">
                {user.avatar && user.avatar !== 'user' ? (
                  <span className="text-xs">{user.avatar}</span>
                ) : (
                  <span className="text-xs">🧑‍💻</span>
                )}
              </div>
              <div className="max-w-[75px] xs:max-w-[110px] sm:max-w-[140px] truncate">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                    {user.name || user.username}
                  </span>
                  <span className="hidden sm:inline-block">
                    {getProviderBadge(user.provider)}
                  </span>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={onLogout}
              title="로그아웃"
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer flex-shrink-0 ml-0.5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>로그인</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs shadow-indigo-200 flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>가입</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

