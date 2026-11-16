import React from 'react'
import { X, Monitor, Download, CheckCircle, RefreshCw, Pin, Sparkles, Layers } from 'lucide-react'

export default function AppDownloadModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const handleDownload = () => {
    // Google Drive 업로드 설치 파일 다운로드 링크 연동
    window.open('https://drive.google.com/file/d/1pDjBd8tehY9PtJwZe4cTyhCA02DAL05D/view?usp=sharing', '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>DailyMate 바탕화면 위젯</span>
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              </h3>
              <p className="text-xs text-slate-400 font-medium">Windows 전용 데스크톱 앱</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/40 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              웹사이트를 켜지 않아도 컴퓨터를 켜면 <strong>PC 바탕화면에 달력 위젯이 바로 표시</strong>됩니다.
              웹에서 등록한 일정과 <strong>실시간으로 완벽하게 동기화</strong>됩니다.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <RefreshCw className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">웹과 실시간 양방향 동기화</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  웹 또는 위젯 어느 곳에서든 일정을 추가/수정/완료하면 실시간으로 반영됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">바탕화면 반투명 글래스 위젯</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  테두리 없는 투명 창으로 바탕화면 원하는 위치에 예쁘게 배치하고 고정할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">윈도우 시작 시 자동 실행 & 트레이 상주</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  PC 부팅 시 자동으로 실행되며 작업표시줄 시계 옆 트레이에서 손쉽게 제어합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Download Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Windows용 설치 파일 다운로드 (.exe)</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Windows 10 / 11 64-bit 지원 • 자동 업데이트 지원
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
