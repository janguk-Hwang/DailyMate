import { useState, useEffect, useRef } from 'react'
import {
  X,
  User,
  Settings as SettingsIcon,
  Shield,
  Info,
  CheckCircle2,
  Flame,
  Calendar,
  Download,
  Trash2,
  KeyRound,
  AlertTriangle,
  Sparkles,
  Save,
  Check,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileCode,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  MessageSquarePlus,
  Send,
  ExternalLink,
  Bug,
  Lightbulb,
  MessageCircle,
  Loader2,
} from 'lucide-react'
import {
  updateProfile,
  updatePassword,
  deleteAccount,
  getUserStats,
  exportSchedules,
  cleanupAllCompletedSchedules,
  submitFeedback,
} from '../services/api'

const AVATAR_OPTIONS = ['🧑‍💻', '🚀', '🌟', '🦊', '🌿', '🎨', '🎯', '⚡', '☕', '🐱', '🐶', '💡']

export default function SettingsAndMyPageModal({
  isOpen,
  initialTab = 'profile',
  onClose,
  user,
  onUserUpdated,
  onLogout,
  onOpenAuth,
  settings,
  onUpdateSettings,
  onRefreshSchedules,
}) {
  const [activeTab, setActiveTab] = useState(initialTab) // 'profile' | 'settings' | 'security' | 'about'

  // Profile States
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('🧑‍💻')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  // Stats States
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Password States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState(null)

  // Delete Account States
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // Data Action States
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [cleanupMsg, setCleanupMsg] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)

  // Feedback & Issue Report States
  const [feedbackCategory, setFeedbackCategory] = useState('feature') // 'feature' | 'bug' | 'other'
  const [feedbackTitle, setFeedbackTitle] = useState('')
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackContact, setFeedbackContact] = useState('')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState('')
  const [feedbackErrorMsg, setFeedbackErrorMsg] = useState('')

  const prevIsOpenRef = useRef(false)
  const prevInitialTabRef = useRef(initialTab)
  const backdropMouseDownRef = useRef(false)
  const backdropMouseUpRef = useRef(false)

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // Sync initial tab and user data on open
  useEffect(() => {
    if (isOpen) {
      if (!prevIsOpenRef.current || prevInitialTabRef.current !== initialTab) {
        setActiveTab(initialTab)
      }
      if (!prevIsOpenRef.current && user) {
        setName(user.name || '')
        setSelectedAvatar(user.avatar || '🧑‍💻')
        loadStats()
      }
    } else {
      setProfileMsg(null)
      setPasswordMsg(null)
      setCleanupMsg(null)
      setDeleteError(null)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setDeletePassword('')
      setDeleteConfirmText('')
    }
    prevIsOpenRef.current = isOpen
    prevInitialTabRef.current = initialTab
  }, [isOpen, initialTab, user])

  // Reset password fields whenever switching tabs or reopening modal
  useEffect(() => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setDeletePassword('')
    setDeleteConfirmText('')
    setPasswordMsg(null)
    setDeleteError(null)
  }, [activeTab, isOpen])

  const loadStats = async () => {
    if (!user) return
    setStatsLoading(true)
    try {
      const data = await getUserStats()
      setStats(data)
    } catch (e) {
      console.warn('Failed to load stats:', e)
    } finally {
      setStatsLoading(false)
    }
  }

  if (!isOpen) return null

  // 1. Handle Instant Avatar Selection
  const handleSelectAvatar = async (av) => {
    setSelectedAvatar(av)
    if (!user) return
    try {
      const res = await updateProfile({
        avatar: av,
      })
      if (onUserUpdated) onUserUpdated(res.user)
    } catch (err) {
      console.warn('Failed to update avatar:', err)
      setSelectedAvatar(user.avatar || '🧑‍💻')
      setProfileMsg({ type: 'error', text: '아바타 변경 실패: ' + err.message })
    }
  }

  // 2. Handle Profile Update (Nickname)
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const res = await updateProfile({
        name: name.trim(),
        avatar: selectedAvatar,
      })
      if (onUserUpdated) onUserUpdated(res.user)
      setProfileMsg({ type: 'success', text: '프로필 정보가 저장되었습니다.' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message })
    } finally {
      setProfileSaving(false)
    }
  }

  // 2. Handle Password Change
  const handleSavePassword = async (e) => {
    e.preventDefault()
    setPasswordMsg(null)

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: '새 비밀번호와 확인이 일치하지 않습니다.' })
      return
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: '비밀번호는 최소 6자 이상이어야 합니다.' })
      return
    }

    setPasswordSaving(true)
    try {
      await updatePassword({ currentPassword, newPassword })
      setPasswordMsg({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message })
    } finally {
      setPasswordSaving(false)
    }
  }

  // 3. Handle Account Withdrawal
  const handleDeleteAccount = async () => {
    const isLocal = user?.provider === 'local'
    if (isLocal && !deletePassword) {
      setDeleteError('비밀번호를 입력해주세요.')
      return
    }
    if (!isLocal && deleteConfirmText !== '회원탈퇴') {
      setDeleteError('탈퇴를 위해 "회원탈퇴"를 정확히 입력해주세요.')
      return
    }

    if (!window.confirm('정말로 탈퇴하시겠습니까? 저장된 모든 일정과 개인 데이터가 영구 삭제됩니다.')) {
      return
    }

    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await deleteAccount({ password: deletePassword })
      alert('회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.')
      onClose()
      if (onLogout) onLogout()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  // 4. Handle Export (JSON / CSV)
  const handleExportJSON = async () => {
    setExportLoading(true)
    try {
      const data = await exportSchedules()
      const jsonStr = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `todo-schedules-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(`내보내기 실패: ${err.message}`)
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportCSV = async () => {
    setExportLoading(true)
    try {
      const data = await exportSchedules()
      const schedules = data.schedules || []

      // CSV Header
      let csvContent = '\uFEFF날짜,제목,메모,완료여부,우선순위,등록일시\n'
      schedules.forEach((item) => {
        const title = `"${(item.title || '').replace(/"/g, '""')}"`
        const desc = `"${(item.description || '').replace(/"/g, '""')}"`
        const completed = item.completed ? '완료' : '미완료'
        const priority = item.priority === 'high' ? '높음' : item.priority === 'low' ? '낮음' : '보통'
        csvContent += `${item.date},${title},${desc},${completed},${priority},${item.created_at || ''}\n`
      })

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `todo-schedules-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(`내보내기 실패: ${err.message}`)
    } finally {
      setExportLoading(false)
    }
  }

  // 5. Cleanup all completed schedules
  const handleCleanupCompleted = async () => {
    if (!window.confirm('전체 날짜에 걸쳐 완료된 모든 일정을 일괄 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    setCleanupLoading(true)
    setCleanupMsg(null)
    try {
      const res = await cleanupAllCompletedSchedules()
      setCleanupMsg(res.message)
      if (onRefreshSchedules) onRefreshSchedules()
      loadStats()
    } catch (err) {
      setCleanupMsg(err.message)
    } finally {
      setCleanupLoading(false)
    }
  }

  // Provider Badge Helper
  const getProviderBadge = (provider) => {
    switch (provider) {
      case 'kakao':
        return <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 font-bold rounded-md">카카오톡 로그인</span>
      case 'google':
        return <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 font-bold rounded-md">Google 계정</span>
      case 'naver':
        return <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800 font-bold rounded-md">네이버 계정</span>
      default:
        return <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 font-bold rounded-md">일반 계정</span>
    }
  }

  // Feedback Submit Handler
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    if (!feedbackTitle.trim()) {
      setFeedbackErrorMsg('제목을 입력해주세요.')
      return
    }
    if (!feedbackContent.trim()) {
      setFeedbackErrorMsg('내용을 입력해주세요.')
      return
    }

    setFeedbackSending(true)
    setFeedbackErrorMsg('')
    setFeedbackSuccessMsg('')

    try {
      const res = await submitFeedback({
        category: feedbackCategory,
        title: feedbackTitle.trim(),
        content: feedbackContent.trim(),
        contact: feedbackContact.trim() || (user ? `${user.name || user.username || '회원'} (${user.email || '계정'})` : ''),
      })
      setFeedbackSuccessMsg(res.message || '소중한 의견이 성공적으로 접수되었습니다. 감사합니다!')
      setFeedbackTitle('')
      setFeedbackContent('')
      setFeedbackContact('')
    } catch (err) {
      setFeedbackErrorMsg(err.message || '제보 접수에 실패했습니다.')
    } finally {
      setFeedbackSending(false)
    }
  }

  // Modal Backdrop Click Helper (외부에서 누르고 외부에서 뗐을 때만 닫기)
  const handleBackdropMouseDown = (e) => {
    backdropMouseDownRef.current = e.target === e.currentTarget
  }

  const handleBackdropMouseUp = (e) => {
    backdropMouseUpRef.current = e.target === e.currentTarget
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && backdropMouseDownRef.current && backdropMouseUpRef.current) {
      onClose()
    }
    backdropMouseDownRef.current = false
    backdropMouseUpRef.current = false
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              {activeTab === 'profile' && <User className="w-5 h-5" />}
              {activeTab === 'settings' && <SettingsIcon className="w-5 h-5" />}
              {activeTab === 'security' && <Shield className="w-5 h-5" />}
              {activeTab === 'about' && <Info className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {activeTab === 'profile' && '마이페이지 & 통계'}
                {activeTab === 'settings' && '캘린더 환경설정'}
                {activeTab === 'security' && '계정 및 보안'}
                {activeTab === 'about' && '서비스 안내 & 제보'}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">개인 맞춤 설정과 일정 데이터를 관리합니다</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-5 gap-1.5 sm:gap-2 flex-shrink-0 overflow-x-auto no-scrollbar py-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>내 정보 & 통계</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>환경설정</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>계정 & 보안</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'about'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>서비스 안내 & 제보</span>
          </button>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ================= TAB 1: PROFILE & STATS ================= */}
          {activeTab === 'profile' && (
            <>
              {!user ? (
                <div className="text-center py-10 px-4">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <User className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-base text-slate-800">로그인이 필요한 메뉴입니다</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    로그인하시면 나의 일정 달성률 통계, 개인 프로필 관리, 데이터 백업 기능을 자유롭게 이용하실 수 있습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onOpenAuth('login')
                    }}
                    className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-sm cursor-pointer"
                  >
                    로그인하고 시작하기
                  </button>
                </div>
              ) : (
                <>
                  {/* Profile Edit Card */}
                  <form onSubmit={handleSaveProfile} className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>프로필 정보</span>
                      </h3>
                      <div>{getProviderBadge(user.provider)}</div>
                    </div>

                    <div className="space-y-4">
                      {/* Avatar Selector */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">내 아바타 아이콘</label>
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">선택 시 즉시 변경</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {AVATAR_OPTIONS.map((av) => (
                            <button
                              key={av}
                              type="button"
                              onClick={() => handleSelectAvatar(av)}
                              title={`${av} 아바타로 즉시 변경`}
                              className={`w-9 h-9 sm:w-10 sm:h-10 text-lg rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                selectedAvatar === av
                                  ? 'bg-indigo-100 dark:bg-indigo-950/80 ring-2 ring-indigo-500 scale-105 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                              }`}
                            >
                              {av}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Name input */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">닉네임</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={30}
                            placeholder="사용할 닉네임을 입력하세요"
                            className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-100"
                          />
                          <button
                            type="submit"
                            disabled={profileSaving || !name.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{profileSaving ? '저장 중...' : '저장'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Account info badges */}
                      {(user.username || user.phone_number) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          {user.username && (
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                              <span className="font-bold text-slate-700 dark:text-slate-300">아이디: </span>
                              <span className="text-slate-600 dark:text-slate-300">{user.username}</span>
                            </div>
                          )}
                          {user.phone_number && (
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                              <span className="font-bold text-slate-700 dark:text-slate-300">인증 휴대폰: </span>
                              <span className="text-slate-600 dark:text-slate-300">{user.phone_number}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {profileMsg && (
                        <div
                          className={`text-xs p-2.5 rounded-xl ${
                            profileMsg.type === 'success'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {profileMsg.text}
                        </div>
                      )}
                    </div>
                  </form>

                  {/* Productivity & Stats Dashboard */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>생산성 & 달성 통계</span>
                      </h3>
                      {statsLoading && <span className="text-[10px] text-slate-400">집계 중...</span>}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                      {/* Total */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-center">
                        <span className="text-[11px] text-slate-500 font-medium block">총 등록 일정</span>
                        <span className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5 block">
                          {stats?.totalCount ?? 0}
                          <span className="text-xs font-normal text-slate-400 ml-0.5">개</span>
                        </span>
                      </div>

                      {/* Completed */}
                      <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/60 text-center">
                        <span className="text-[11px] text-emerald-700 font-medium block">완수한 일정</span>
                        <span className="text-lg sm:text-xl font-extrabold text-emerald-800 mt-0.5 block">
                          {stats?.completedCount ?? 0}
                          <span className="text-xs font-normal text-emerald-600 ml-0.5">개</span>
                        </span>
                      </div>

                      {/* Rate */}
                      <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-200/60 text-center">
                        <span className="text-[11px] text-indigo-700 font-medium block">누적 달성률</span>
                        <span className="text-lg sm:text-xl font-extrabold text-indigo-800 mt-0.5 block">
                          {stats?.completionRate ?? 0}%
                        </span>
                      </div>

                      {/* Streak */}
                      <div
                        className="bg-amber-50/80 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200/60 dark:border-amber-900/60 text-center"
                        title="일정이 비어있는 날을 제외하고, 일정이 등록된 날들을 기준으로 연속으로 모두 완료한 날 수입니다."
                      >
                        <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium block flex items-center justify-center gap-1">
                          <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>연속 완수</span>
                        </span>
                        <span className="text-lg sm:text-xl font-extrabold text-amber-800 dark:text-amber-200 mt-0.5 block">
                          {stats?.streakDays ?? 0}
                          <span className="text-xs font-normal text-amber-600 dark:text-amber-400 ml-0.5">일째</span>
                        </span>
                      </div>
                    </div>

                    {/* Monthly Summary Box */}
                    {stats?.currentMonth && (
                      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/60 rounded-2xl p-3.5 border border-indigo-200/70 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <div>
                            <span className="font-bold text-indigo-950">
                              {stats.currentMonth.yearMonth} 이번 달 완수율
                            </span>
                            <span className="text-indigo-600 ml-2 font-extrabold">
                              {stats.currentMonth.rate}%
                            </span>
                          </div>
                        </div>
                        <span className="text-indigo-700 text-[11px] font-medium">
                          {stats.currentMonth.completed} / {stats.currentMonth.total}개 완료
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Data Export & Backup & Cleanup */}
                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-indigo-600" />
                      <span>데이터 백업 & 관리</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* JSON Export */}
                      <button
                        type="button"
                        onClick={handleExportJSON}
                        disabled={exportLoading}
                        className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                            <FileCode className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">JSON 데이터 백업</div>
                            <div className="text-[10px] text-slate-400">모든 일정 데이터 백업 다운로드</div>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                      </button>

                      {/* Excel/CSV Export */}
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        disabled={exportLoading}
                        className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">엑셀(CSV) 내보내기</div>
                            <div className="text-[10px] text-slate-400">스프레드시트 열기 가능 형식</div>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
                      </button>
                    </div>

                    {/* Cleanup completed */}
                    <div className="mt-3 flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>완료된 모든 일정 일괄 정리</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          모든 날짜의 완료된 항목을 일괄 삭제하여 깔끔하게 정리합니다
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCleanupCompleted}
                        disabled={cleanupLoading}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0"
                      >
                        {cleanupLoading ? '정리 중...' : '일괄 정리'}
                      </button>
                    </div>
                    {cleanupMsg && <p className="text-xs text-indigo-600 mt-1.5 font-medium">{cleanupMsg}</p>}
                  </div>
                </>
              )}
            </>
          )}

          {/* ================= TAB 2: SETTINGS ================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* 1. Dark Mode / Theme Mode */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 block flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>화면 모드 (다크 모드)</span>
                </label>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mb-3">밝은 라이트 모드 또는 눈이 편안한 다크 모드를 선택합니다.</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, darkMode: 'light' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      settings.darkMode === 'light'
                        ? 'border-indigo-500 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs ring-2 ring-indigo-400/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>라이트</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, darkMode: 'dark' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      settings.darkMode === 'dark'
                        ? 'border-indigo-500 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs ring-2 ring-indigo-400/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>다크</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, darkMode: 'system' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      (settings.darkMode || 'system') === 'system'
                        ? 'border-indigo-500 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs ring-2 ring-indigo-400/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5 text-slate-400" />
                    <span>시스템</span>
                  </button>
                </div>
              </div>

              {/* 2. Start of Week */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 block">달력 시작 요일</label>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mb-3">월간 캘린더 그리드의 시작 기준 요일을 선택합니다.</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, startOfWeek: 'sunday' })}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                      settings.startOfWeek === 'sunday'
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>일요일 시작 (일~토)</span>
                    {settings.startOfWeek === 'sunday' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, startOfWeek: 'monday' })}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                      settings.startOfWeek === 'monday'
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>월요일 시작 (월~일)</span>
                    {settings.startOfWeek === 'monday' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                </div>
              </div>

              {/* 3. Default Priority */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 block">새 일정 기본 우선순위</label>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mb-3">일정을 빠르게 추가할 때 기본 지정될 우선순위입니다.</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, defaultPriority: 'high' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      settings.defaultPriority === 'high'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>높음 (High)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, defaultPriority: 'medium' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      settings.defaultPriority === 'medium'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>보통 (Medium)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, defaultPriority: 'low' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      settings.defaultPriority === 'low'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>낮음 (Low)</span>
                  </button>
                </div>
              </div>

              {/* 4. Completed Item Display */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 block">완료된 일정 표시 방식</label>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mb-3">할 일을 완료했을 때 목록에서 보여주는 방식을 설정합니다.</p>
                <div className="space-y-2">
                  <label
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      settings.completedDisplay === 'show'
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="completedDisplay"
                        checked={settings.completedDisplay === 'show'}
                        onChange={() => onUpdateSettings({ ...settings, completedDisplay: 'show' })}
                        className="accent-indigo-600"
                      />
                      <span className="text-xs">일반 표시 (취소선 유지)</span>
                    </div>
                    <Eye className="w-4 h-4 text-slate-400" />
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      settings.completedDisplay === 'bottom'
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="completedDisplay"
                        checked={settings.completedDisplay === 'bottom'}
                        onChange={() => onUpdateSettings({ ...settings, completedDisplay: 'bottom' })}
                        className="accent-indigo-600"
                      />
                      <span className="text-xs">완료 항목 맨 아래로 이동</span>
                    </div>
                    <span className="text-[11px] text-slate-400">자동 하단 정렬</span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      settings.completedDisplay === 'hide'
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="completedDisplay"
                        checked={settings.completedDisplay === 'hide'}
                        onChange={() => onUpdateSettings({ ...settings, completedDisplay: 'hide' })}
                        className="accent-indigo-600"
                      />
                      <span className="text-xs">완료 항목 자동 숨기기</span>
                    </div>
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: SECURITY ================= */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {!user ? (
                <div className="text-center py-10 px-4">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-base text-slate-800">로그인이 필요한 메뉴입니다</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    계정 보안 관리 및 비밀번호 변경은 로그인 후 이용하실 수 있습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onOpenAuth('login')
                    }}
                    className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-sm cursor-pointer"
                  >
                    로그인하기
                  </button>
                </div>
              ) : (
                <>
                  {/* Password Change (Local User Only) */}
                  {user.provider === 'local' ? (
                    <form onSubmit={handleSavePassword} autoComplete="off" className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3.5">
                      {/* Fake inputs to prevent browser aggressive credential autofill */}
                      <input type="text" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} autoComplete="off" />
                      <input type="password" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} autoComplete="new-password" />

                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                        <KeyRound className="w-4 h-4 text-indigo-600" />
                        <span>비밀번호 변경</span>
                      </h3>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">현재 비밀번호</label>
                        <div className="relative">
                          <input
                            type={showCurrentPw ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="현재 비밀번호를 입력하세요"
                            autoComplete="new-password"
                            required
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPw(!showCurrentPw)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">새 비밀번호 (6자 이상)</label>
                        <div className="relative">
                          <input
                            type={showNewPw ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="새 비밀번호를 입력하세요"
                            minLength={6}
                            autoComplete="new-password"
                            required
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw(!showNewPw)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">새 비밀번호 확인</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="새 비밀번호를 한 번 더 입력하세요"
                          autoComplete="new-password"
                          required
                          className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {passwordMsg && (
                        <div
                          className={`text-xs p-2.5 rounded-xl ${
                            passwordMsg.type === 'success'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {passwordMsg.text}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={passwordSaving || !currentPassword || !newPassword}
                        className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
                      >
                        {passwordSaving ? '변경 처리 중...' : '비밀번호 변경하기'}
                      </button>
                    </form>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span>소셜 로그인 연동 계정</span>
                      </div>
                      <p className="text-slate-500">
                        회원님은 <strong>{user.provider.toUpperCase()}</strong> 소셜 계정으로 로그인 중입니다.
                        비밀번호 변경 및 계정 보안은 해당 소셜 서비스의 보안 설정에서 관리됩니다.
                      </p>
                    </div>
                  )}

                  {/* Danger Zone: Account Withdrawal */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-3">
                    <div className="flex items-center gap-2 text-rose-700">
                      <AlertTriangle className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">위험 구역 (Danger Zone)</h4>
                    </div>
                    <p className="text-xs text-slate-600">
                      회원 탈퇴 시 작성하신 <strong>모든 일정 데이터 및 개인정보가 영구적으로 삭제</strong>되며 복구할 수 없습니다.
                    </p>

                    {user.provider === 'local' ? (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          탈퇴 확인을 위해 비밀번호를 입력해주세요
                        </label>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="현재 비밀번호"
                          autoComplete="new-password"
                          className="w-full px-3 py-2 text-xs bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          탈퇴를 확인하기 위해 아래에 <strong>"회원탈퇴"</strong>를 입력해주세요
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="회원탈퇴"
                          className="w-full px-3 py-2 text-xs bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    )}

                    {deleteError && <p className="text-xs text-rose-600 font-medium">{deleteError}</p>}

                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="w-full py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {deleteLoading ? '탈퇴 처리 중...' : '회원 탈퇴 및 모든 데이터 영구 삭제'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================= TAB 4: ABOUT & FEEDBACK ================= */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* App Banner */}
              <div className="text-center py-5 bg-gradient-to-b from-indigo-50/60 to-white dark:from-indigo-950/40 dark:to-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/60">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-2.5 shadow-md shadow-indigo-200 dark:shadow-none">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">To-Do 캘린더</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">나만의 스마트한 개인 일정 & 플래너</p>
                <span className="inline-block mt-2 px-2.5 py-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100/80 dark:bg-indigo-950/80 rounded-full">
                  버전 v1.2.0
                </span>
              </div>

              {/* Direct Feedback & Issue Report Card */}
              <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-slate-100">
                    <MessageSquarePlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>개선 사항 및 이슈 제보</span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">앱 내 직접 접수</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  서비스를 이용하며 바라는 개선점이나 발견하신 버그/불편 사항을 작성해주세요. 소중한 의견을 적극 검토하여 업데이트에 반영하겠습니다.
                </p>

                {feedbackSuccessMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{feedbackSuccessMsg}</span>
                  </div>
                )}

                {feedbackErrorMsg && (
                  <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{feedbackErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleFeedbackSubmit} className="space-y-3.5">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      제보 유형
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFeedbackCategory('feature')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                          feedbackCategory === 'feature'
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span>개선 제안</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackCategory('bug')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                          feedbackCategory === 'bug'
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-700 text-rose-700 dark:text-rose-300 ring-2 ring-rose-400/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Bug className="w-3.5 h-3.5 text-rose-500" />
                        <span>버그 제보</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackCategory('other')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                          feedbackCategory === 'other'
                            ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-700 text-sky-700 dark:text-sky-300 ring-2 ring-sky-400/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-sky-500" />
                        <span>기타 문의</span>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      제목 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={feedbackTitle}
                      onChange={(e) => setFeedbackTitle(e.target.value)}
                      maxLength={100}
                      placeholder={
                        feedbackCategory === 'feature'
                          ? '예: 캘린더에 공휴일 및 대체휴일 표시 기능 제안'
                          : feedbackCategory === 'bug'
                          ? '예: 모바일 화면에서 특정 버튼 터치 오류'
                          : '문의 제목을 입력하세요'
                      }
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-100"
                      required
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      상세 내용 <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      rows={4}
                      placeholder="자세한 제안 배경, 원하시는 동작, 또는 버그가 발생한 상황과 재현 경로를 편하게 적어주세요."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-100 resize-none leading-relaxed"
                      required
                    />
                  </div>

                  {/* Contact / Email (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      연락처 / 이메일 <span className="text-slate-400 text-[11px] font-normal">(선택)</span>
                    </label>
                    <input
                      type="text"
                      value={feedbackContact}
                      onChange={(e) => setFeedbackContact(e.target.value)}
                      placeholder={
                        user
                          ? `답변 수신용 이메일 (미입력 시 로그인 닉네임 [${user.name || user.username}]으로 기록)`
                          : '답변을 원하시면 이메일 주소를 남겨주세요'
                      }
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-1 flex justify-end">
                    <button
                      type="submit"
                      disabled={feedbackSending || !feedbackTitle.trim() || !feedbackContent.trim()}
                      className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      {feedbackSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>전송 중...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>제보 전송하기</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* GitHub Link Card */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span>GitHub 공개 저장소 및 이슈 트래커</span>
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    GitHub 계정이 있으신 경우 이슈를 직접 등록하거나 코드를 확인할 수 있습니다.
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href="https://github.com/janguk-Hwang/todo-calendar-app/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-800 transition"
                  >
                    <span>이슈 제보</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://github.com/janguk-Hwang/todo-calendar-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
                  >
                    <span>저장소 방문</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between flex-shrink-0 text-xs">
          {user ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                if (onLogout) onLogout()
              }}
              className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>로그아웃</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
