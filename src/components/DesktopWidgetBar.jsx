import React from 'react'
import {
  Pin,
  PinOff,
  Maximize2,
  Minimize2,
  Minus,
  X,
  Calendar,
  Layers,
  Settings,
  LayoutGrid,
  Square
} from 'lucide-react'

export default function DesktopWidgetBar({
  isWidget,
  widgetView = 'grid', // 'grid' (DesktopCal 대형) | 'compact' (슬림 위젯)
  isLocked,
  alwaysOnBottom,
  onToggleLock,
  onToggleWidgetMode,
  onToggleViewType,
  onToggleAlwaysOnBottom,
  onMinimizeToTray,
  onClose,
  onOpenSettings
}) {
  return (
    <div
      className={`w-full flex items-center justify-between px-3 py-2 select-none border-b transition-colors ${
        isWidget
          ? 'bg-slate-900/80 dark:bg-slate-950/80 text-white border-white/10 backdrop-blur-md rounded-t-2xl'
          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
      } ${isLocked ? '' : 'cursor-move'}`}
      style={{ WebkitAppRegion: isLocked ? 'no-drag' : 'drag' }}
    >
      {/* Left: Brand / Title */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: isLocked ? 'no-drag' : 'drag' }}>
        <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow-xs">
          <Calendar className="w-3 h-3" />
        </div>
        <span className="text-xs font-bold tracking-tight">DailyMate</span>
        {isWidget && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
            {widgetView === 'grid' ? '바탕화면 달력' : '미니 위젯'}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* 대형 캘린더 (DesktopCal) ↔ 슬림 위젯 토글 */}
        {isWidget && onToggleViewType && (
          <button
            type="button"
            onClick={onToggleViewType}
            title={widgetView === 'grid' ? '슬림 사이드 위젯 모드로 전환' : '바탕화면 대형 달력 모드(DesktopCal)로 전환'}
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1 text-[11px] font-semibold px-2 bg-white/5"
          >
            {widgetView === 'grid' ? (
              <>
                <Square className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">슬림 뷰</span>
              </>
            ) : (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">대형 달력</span>
              </>
            )}
          </button>
        )}

        {/* 위치 고정 / 잠금 토글 */}
        <button
          type="button"
          onClick={onToggleLock}
          title={isLocked ? '위치 고정 해제 (드래그 가능)' : '위치 고정 (잠금)'}
          className={`p-1 rounded-md transition-colors ${
            isLocked
              ? 'text-indigo-400 bg-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800'
          }`}
        >
          {isLocked ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>

        {/* 바탕화면 최하단 고정 */}
        <button
          type="button"
          onClick={onToggleAlwaysOnBottom}
          title={alwaysOnBottom ? '바탕화면 고정 해제' : '바탕화면 고정 (항상 맨 아래)'}
          className={`p-1 rounded-md transition-colors ${
            alwaysOnBottom
              ? 'text-indigo-400 bg-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
        </button>

        {/* 위젯 모드 / 일반 창 모드 전환 */}
        <button
          type="button"
          onClick={onToggleWidgetMode}
          title={isWidget ? '일반 웹 창 모드로 전환' : '바탕화면 위젯 모드로 전환'}
          className="p-1 text-slate-400 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 rounded-md transition-colors"
        >
          {isWidget ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
        </button>

        {/* 설정 버튼 */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            title="설정"
            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}

        {/* 트레이로 최소화 */}
        <button
          type="button"
          onClick={onMinimizeToTray}
          title="트레이로 최소화"
          className="p-1 text-slate-400 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 rounded-md transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* 트레이로 숨기기 (닫기) */}
        <button
          type="button"
          onClick={onClose}
          title="트레이로 숨기기"
          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

