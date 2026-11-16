import React, { useState, useRef, useEffect } from 'react'
import {
  Pin,
  PinOff,
  Maximize2,
  Minimize2,
  Minus,
  X,
  Calendar,
  Settings,
  LayoutGrid,
  Square,
  Droplets
} from 'lucide-react'

export default function DesktopWidgetBar({
  isWidget,
  widgetView = 'grid', // 'grid' (DesktopCal 대형) | 'compact' (슬림 위젯)
  isLocked,
  onToggleLock,
  onToggleWidgetMode,
  onToggleViewType,
  widgetOpacity = 90,
  onChangeOpacity,
  onMinimizeToTray,
  onClose,
  onOpenSettings
}) {
  const [showOpacityPopover, setShowOpacityPopover] = useState(false)
  const popoverRef = useRef(null)

  // 외부 클릭 시 투명도 팝오버 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowOpacityPopover(false)
      }
    }
    if (showOpacityPopover) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOpacityPopover])

  return (
    <div
      className={`w-full flex items-center justify-between px-3 py-2 select-none border-b transition-colors relative z-40 ${isWidget
        ? 'bg-black/25 dark:bg-black/40 text-white border-white/15 backdrop-blur-md rounded-t-2xl'
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

        {/* 투명도 조절 요소 (슬림 뷰, 대형 달력 모드 공통 지원) */}
        {isWidget && onChangeOpacity && (
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setShowOpacityPopover(!showOpacityPopover)}
              title={`위젯 투명도 조절 (현재: ${widgetOpacity}%)`}
              className={`p-1 px-2 rounded-md transition-colors flex items-center gap-1 text-[11px] font-semibold ${showOpacityPopover
                ? 'text-white bg-indigo-600/40'
                : 'text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 bg-white/5'
                }`}
            >
              <Droplets className="w-3.5 h-3.5 text-indigo-400" />
              <span>{widgetOpacity}%</span>
            </button>

            {/* 투명도 조절 팝오버 창 */}
            {showOpacityPopover && (
              <div
                className="absolute right-0 top-full mt-2 w-52 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                style={{ WebkitAppRegion: 'no-drag' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-indigo-500" />
                    <span>창 투명도</span>
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {widgetOpacity}%
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="30"
                  max="100"
                  step="5"
                  value={widgetOpacity}
                  onChange={(e) => onChangeOpacity(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                />

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1 mt-3">
                  {[50, 70, 85, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onChangeOpacity(val)}
                      className={`py-1 text-[10px] font-bold rounded-lg transition-colors ${widgetOpacity === val
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 위치 고정 / 잠금 토글 */}
        <button
          type="button"
          onClick={onToggleLock}
          title={isLocked ? '위치 고정 해제 (드래그 가능)' : '위치 고정 (잠금)'}
          className={`p-1 rounded-md transition-colors ${isLocked
            ? 'text-indigo-400 bg-indigo-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800'
            }`}
        >
          {isLocked ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
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
          title="닫기 (트레이로 최소화)"
          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-white/10 dark:hover:bg-slate-800 rounded-md transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
