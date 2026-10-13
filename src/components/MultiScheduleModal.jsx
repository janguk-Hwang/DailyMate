import { useState, useMemo, useEffect } from 'react'
import {
  X,
  Calendar,
  CalendarRange,
  Repeat,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  CalendarDays,
  Sparkles,
} from 'lucide-react'

// Helper to format Date to YYYY-MM-DD in local time
const formatDateStr = (d) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateStr = (str) => {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const DAYS_OF_WEEK = [
  { label: '일', value: 0 },
  { label: '월', value: 1 },
  { label: '화', value: 2 },
  { label: '수', value: 3 },
  { label: '목', value: 4 },
  { label: '금', value: 5 },
  { label: '토', value: 6 },
]

export default function MultiScheduleModal({
  isOpen,
  onClose,
  initialDate,
  onSubmitBatch,
}) {
  const [tab, setTab] = useState('range') // 'range' | 'weekly' | 'custom'
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // 1. Range Mode states
  const [startDate, setStartDate] = useState(initialDate || formatDateStr(new Date()))
  const [endDate, setEndDate] = useState(() => {
    const d = initialDate ? parseDateStr(initialDate) : new Date()
    d.setDate(d.getDate() + 3)
    return formatDateStr(d)
  })

  // 2. Weekly Repeat Mode states
  const [weeklyStart, setWeeklyStart] = useState(initialDate || formatDateStr(new Date()))
  const [weeklyEnd, setWeeklyEnd] = useState(() => {
    const d = initialDate ? parseDateStr(initialDate) : new Date()
    d.setMonth(d.getMonth() + 1)
    return formatDateStr(d)
  })
  const [selectedDays, setSelectedDays] = useState([])

  // 3. Custom Multiple Dates Mode states
  const [customDates, setCustomDates] = useState([])
  const [pickDateInput, setPickDateInput] = useState(initialDate || formatDateStr(new Date()))

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('')
      setSelectedDays([])
      if (initialDate) {
        setStartDate(initialDate)
        setWeeklyStart(initialDate)
        setPickDateInput(initialDate)
        if (!customDates.includes(initialDate)) {
          setCustomDates([initialDate])
        }
      }
    }
  }, [isOpen, initialDate])

  // Calculate target dates according to active tab
  const computedDates = useMemo(() => {
    if (tab === 'range') {
      if (!startDate || !endDate) return []
      const start = parseDateStr(startDate)
      const end = parseDateStr(endDate)
      if (start > end) return []

      const dates = []
      const curr = new Date(start)
      // Safety limit max 90 days to prevent browser hanging
      let count = 0
      while (curr <= end && count < 90) {
        dates.push(formatDateStr(curr))
        curr.setDate(curr.getDate() + 1)
        count++
      }
      return dates
    }

    if (tab === 'weekly') {
      if (!weeklyStart || !weeklyEnd || selectedDays.length === 0) return []
      const start = parseDateStr(weeklyStart)
      const end = parseDateStr(weeklyEnd)
      if (start > end) return []

      const dates = []
      const curr = new Date(start)
      let count = 0
      while (curr <= end && count < 180) {
        if (selectedDays.includes(curr.getDay())) {
          dates.push(formatDateStr(curr))
        }
        curr.setDate(curr.getDate() + 1)
        count++
      }
      return dates
    }

    if (tab === 'custom') {
      return [...customDates].sort()
    }

    return []
  }, [tab, startDate, endDate, weeklyStart, weeklyEnd, selectedDays, customDates])

  if (!isOpen) return null

  // Handle Day toggle for weekly repeat
  const toggleDay = (dayVal) => {
    setSelectedDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    )
  }

  // Handle adding a custom date
  const handleAddCustomDate = () => {
    if (!pickDateInput) return
    if (!customDates.includes(pickDateInput)) {
      setCustomDates((prev) => [...prev, pickDateInput].sort())
    }
  }

  const handleRemoveCustomDate = (dateToRemove) => {
    setCustomDates((prev) => prev.filter((d) => d !== dateToRemove))
  }

  const titleItems = useMemo(() => {
    return title
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }, [title])

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (titleItems.length === 0) {
      setErrorMsg('일정 제목을 입력해주세요.')
      return
    }

    if (computedDates.length === 0) {
      if (tab === 'range') setErrorMsg('시작일과 종료일을 올바르게 설정해주세요.')
      else if (tab === 'weekly') setErrorMsg('반복할 요일을 하나 이상 선택해주세요.')
      else setErrorMsg('등록할 날짜를 하나 이상 추가해주세요.')
      return
    }

    try {
      setLoading(true)
      await onSubmitBatch({
        title: title.trim(),
        titles: titleItems,
        dates: computedDates,
        priority,
      })
      setTitle('')
      onClose()
    } catch (err) {
      setErrorMsg(err.message || '일괄 일정 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transition-all">
        {/* Header */}
        <div className="px-4.5 pt-5 pb-3.5 sm:px-6 sm:pt-6 sm:pb-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 rounded-full text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-200" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">다중 / 반복 일정 등록</h2>
          </div>
          <p className="text-[11px] sm:text-xs text-indigo-100/90">
            기간 일정, 매주 요일 반복, 또는 원하는 여러 날을 선택해 한 번에 등록하세요.
          </p>

          {/* Mode Switch Tabs */}
          <div className="flex mt-3.5 sm:mt-4 p-1 bg-indigo-900/40 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setTab('range')
                setErrorMsg('')
              }}
              className={`flex-1 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${tab === 'range'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-indigo-200 hover:text-white'
                }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>연속 기간</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('weekly')
                setErrorMsg('')
              }}
              className={`flex-1 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${tab === 'weekly'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-indigo-200 hover:text-white'
                }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>요일 반복</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('custom')
                setErrorMsg('')
              }}
              className={`flex-1 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${tab === 'custom'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-indigo-200 hover:text-white'
                }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>직접 선택</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title & Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              일정 제목 <span className="text-red-500">*</span>
              <span className="text-[11px] font-normal text-slate-500 ml-1.5">
                (쉼표 , 로 구분 시 여러 개 동시 등록)
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 프로젝트 스프린트, 운동, 학원 수업 (쉼표로 구분)"
              className="w-full px-3.5 sm:px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              required
            />
            {titleItems.length > 1 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-indigo-600 font-medium">
                <span>💡 {titleItems.length}개 일정 인식:</span>
                <span className="text-slate-600 font-normal truncate">
                  {titleItems.join(' • ')}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">우선순위</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="high">우선순위: 높음 🔴</option>
              <option value="medium">우선순위: 보통 🟡</option>
              <option value="low">우선순위: 낮음 🟢</option>
            </select>
          </div>

          {/* TAB 1: Date Range */}
          {tab === 'range' && (
            <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 sm:space-y-3">
              <div className="font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                <CalendarRange className="w-4 h-4 text-indigo-600" />
                <span>연속된 기간 설정</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">시작일</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">종료일</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Weekly Repeat */}
          {tab === 'weekly' && (
            <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 sm:space-y-3">
              <div className="font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-indigo-600" />
                <span>매주 반복 요일 및 기간 설정</span>
              </div>

              {/* Day of Week Selectors */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5">
                  반복할 요일 (다중 선택)
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = selectedDays.includes(day.value)
                    const isWeekend = day.value === 0 || day.value === 6
                    return (
                      <button
                        type="button"
                        key={day.value}
                        onClick={() => toggleDay(day.value)}
                        className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 ${isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : isWeekend
                            ? 'bg-white text-rose-500 hover:bg-slate-100 border border-slate-200'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
                {selectedDays.length === 0 && (
                  <p className="text-[11px] text-indigo-600 mt-1.5 font-medium">
                    ※ 반복할 요일을 최소 1개 이상 선택해주세요.
                  </p>
                )}
              </div>

              {/* Range for repeat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">반복 시작일</label>
                  <input
                    type="date"
                    value={weeklyStart}
                    onChange={(e) => setWeeklyStart(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">반복 종료일</label>
                  <input
                    type="date"
                    value={weeklyEnd}
                    min={weeklyStart}
                    onChange={(e) => setWeeklyEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Custom Multiple Dates */}
          {tab === 'custom' && (
            <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 sm:space-y-3">
              <div className="font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>원하는 날짜를 선택하여 목록에 추가</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="date"
                  value={pickDateInput}
                  onChange={(e) => setPickDateInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomDate}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>추가</span>
                </button>
              </div>

              {/* Selected Dates Chips */}
              {customDates.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
                  {customDates.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-[11px] font-medium"
                    >
                      <span>{d}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomDate(d)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  위에서 날짜를 선택하고 [추가]를 눌러주세요.
                </p>
              )}
            </div>
          )}

          {/* Summary Preview Box */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1 text-xs">
            <div className="flex items-center gap-1.5 text-indigo-800 font-semibold">
              <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>등록 예정:</span>
              <span className="font-extrabold text-sm text-indigo-950 font-mono">
                {computedDates.length}일
                {titleItems.length > 1 && ` × ${titleItems.length}개 일정`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {computedDates.length > 0 && (
                <span className="text-[11px] text-indigo-600 font-medium">
                  ({computedDates[0]} ~ {computedDates[computedDates.length - 1]})
                </span>
              )}
              <span className="font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-lg text-[11px]">
                총 {computedDates.length * (titleItems.length || 1)}건
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || computedDates.length === 0 || titleItems.length === 0}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>일괄 등록 처리 중...</span>
              </>
            ) : (
              <span>
                {titleItems.length > 1
                  ? `총 ${computedDates.length * titleItems.length}건 일괄 등록 (${computedDates.length}일 × ${titleItems.length}개)`
                  : `총 ${computedDates.length}개 날짜에 일괄 등록`}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
