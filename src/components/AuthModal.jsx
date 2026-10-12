import { useState, useEffect } from 'react'
import {
  X,
  Lock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Send,
  Loader2,
} from 'lucide-react'
import {
  loginUser,
  signupUser,
  sendPhoneCode,
  verifyPhoneCode,
  checkUsernameAvailability,
  getOAuthUrl,
} from '../services/api'

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode) // 'login' | 'signup'
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Login form state
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup form state
  const [signupUsername, setSignupUsername] = useState('')
  const [usernameChecked, setUsernameChecked] = useState(null) // null | true | false
  const [checkingUsername, setCheckingUsername] = useState(false)

  const [signupName, setSignupName] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('')

  const [signupPhone, setSignupPhone] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [devCodeHint, setDevCodeHint] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)

  // OAuth notice modal / message
  const [oauthNotice, setOauthNotice] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setErrorMsg('')
      setSuccessMsg('')
      setOauthNotice(null)
    }
  }, [isOpen, initialMode])

  if (!isOpen) return null

  // ---------------- Handlers: Login ----------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setErrorMsg('아이디와 비밀번호를 모두 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      setErrorMsg('')
      const res = await loginUser({
        username: loginUsername.trim(),
        password: loginPassword,
      })
      onAuthSuccess(res.user)
      onClose()
    } catch (err) {
      setErrorMsg(err.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // ---------------- Handlers: Signup ----------------
  const handleCheckUsername = async () => {
    const trimmed = signupUsername.trim()
    if (!trimmed || trimmed.length < 3) {
      setErrorMsg('아이디는 3자 이상이어야 합니다.')
      return
    }

    try {
      setCheckingUsername(true)
      setErrorMsg('')
      const res = await checkUsernameAvailability(trimmed)
      if (res.available) {
        setUsernameChecked(true)
        setSuccessMsg('사용 가능한 아이디입니다.')
      } else {
        setUsernameChecked(false)
        setErrorMsg(res.message || '이미 사용 중인 아이디입니다.')
      }
    } catch (err) {
      setUsernameChecked(false)
      setErrorMsg(err.message)
    } finally {
      setCheckingUsername(false)
    }
  }

  const handleSendCode = async () => {
    const cleanPhone = signupPhone.replace(/[^0-9]/g, '')
    if (!/^01[0-9]{8,9}$/.test(cleanPhone)) {
      setErrorMsg('올바른 휴대폰 번호(예: 01012345678)를 입력해주세요.')
      return
    }

    try {
      setSendingCode(true)
      setErrorMsg('')
      const res = await sendPhoneCode(cleanPhone)
      setCodeSent(true)
      if (res.devCode) {
        setDevCodeHint(res.devCode)
        setPhoneCode(res.devCode) // 편리한 자동 입력 지원
      }
      setSuccessMsg(`인증번호가 발송되었습니다.${res.devCode ? ` [임시 테스트 인증번호: ${res.devCode}]` : ''}`)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerifyCode = async () => {
    const cleanPhone = signupPhone.replace(/[^0-9]/g, '')
    if (!phoneCode.trim()) {
      setErrorMsg('인증번호 6자리를 입력해주세요.')
      return
    }

    try {
      setVerifyingCode(true)
      setErrorMsg('')
      await verifyPhoneCode(cleanPhone, phoneCode.trim())
      setPhoneVerified(true)
      setSuccessMsg('휴대폰 번호 인증이 성공적으로 완료되었습니다.')
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setVerifyingCode(false)
    }
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!signupUsername.trim()) {
      return setErrorMsg('아이디를 입력해주세요.')
    }
    if (usernameChecked !== true) {
      return setErrorMsg('아이디 중복 확인을 진행해주세요.')
    }
    if (!signupName.trim()) {
      return setErrorMsg('이름 또는 닉네임을 입력해주세요.')
    }
    if (!signupPassword || signupPassword.length < 6) {
      return setErrorMsg('비밀번호는 최소 6자 이상이어야 합니다.')
    }
    if (signupPassword !== signupPasswordConfirm) {
      return setErrorMsg('비밀번호 확인이 일치하지 않습니다.')
    }
    if (!phoneVerified) {
      return setErrorMsg('전화번호 인증을 완료해주세요.')
    }

    try {
      setLoading(true)
      const res = await signupUser({
        username: signupUsername.trim(),
        password: signupPassword,
        name: signupName.trim(),
        phoneNumber: signupPhone.replace(/[^0-9]/g, ''),
      })
      onAuthSuccess(res.user)
      onClose()
    } catch (err) {
      setErrorMsg(err.message || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // ---------------- Handlers: OAuth ----------------
  const handleSocialLogin = async (provider) => {
    try {
      setErrorMsg('')
      setOauthNotice(null)
      const res = await getOAuthUrl(provider)
      if (res.configured && res.url) {
        window.location.href = res.url
      } else {
        const providerName =
          provider === 'kakao' ? '카카오톡' : provider === 'google' ? '구글' : '네이버'
        setOauthNotice({
          provider: providerName,
          message: res.message || `${providerName} OAuth 연동 키가 .env에 아직 설정되지 않았습니다.`,
        })
      }
    } catch (err) {
      setErrorMsg(`소셜 로그인 요청 실패: ${err.message}`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transition-all transform duration-200">
        {/* Header Bar */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-indigo-200" />
            <h2 className="text-xl font-bold tracking-tight">
              {mode === 'login' ? '로그인' : '회원가입'}
            </h2>
          </div>
          <p className="text-xs text-indigo-100/90">
            {mode === 'login'
              ? '로그인하여 나만의 개인 일정을 안전하게 관리하세요.'
              : '간단한 정보와 전화번호 인증으로 회원가입을 완료하세요.'}
          </p>

          {/* Mode Switch Tabs */}
          <div className="flex mt-4 p-1 bg-indigo-900/40 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setErrorMsg('')
                setSuccessMsg('')
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setErrorMsg('')
                setSuccessMsg('')
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              일반 회원가입
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* OAuth Unconfigured Notice */}
          {oauthNotice && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                <AlertCircle className="w-4 h-4" />
                <span>{oauthNotice.provider} 연동 설정 안내</span>
              </div>
              <p className="text-amber-700 leading-relaxed">{oauthNotice.message}</p>
            </div>
          )}

          {/* ---------------- LOGIN MODE ---------------- */}
          {mode === 'login' && (
            <div>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    아이디
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="아이디를 입력하세요"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    비밀번호
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>로그인 중...</span>
                    </>
                  ) : (
                    <span>로그인</span>
                  )}
                </button>
              </form>

              {/* Social Login Separator */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <span className="relative px-3 bg-white text-xs font-medium text-slate-400">
                  또는 소셜 계정으로 로그인
                </span>
              </div>

              {/* Social Buttons */}
              <div className="space-y-2.5">
                {/* Kakao */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin('kakao')}
                  className="w-full py-2.5 px-4 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-medium rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.83 1.83 5.32 4.63 6.72l-.95 3.52c-.1.37.28.69.61.52l4.23-2.19c.48.05.97.08 1.48.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                  </svg>
                  <span>카카오톡으로 시작하기</span>
                </button>

                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-xs flex items-center justify-center gap-2.5 border border-slate-200 transition-all shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Google 계정으로 시작하기</span>
                </button>

                {/* Naver */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin('naver')}
                  className="w-full py-2.5 px-4 bg-[#03C75A] hover:bg-[#02B150] text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer"
                >
                  <span className="font-extrabold text-sm leading-none">N</span>
                  <span>네이버로 시작하기</span>
                </button>
              </div>
            </div>
          )}

          {/* ---------------- SIGNUP MODE ---------------- */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Username + Duplicate Check */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  아이디 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={signupUsername}
                      onChange={(e) => {
                        setSignupUsername(e.target.value)
                        setUsernameChecked(null)
                      }}
                      placeholder="3~20자 영문, 숫자"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckUsername}
                    disabled={checkingUsername || !signupUsername.trim()}
                    className={`px-3 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
                      usernameChecked === true
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {checkingUsername ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : usernameChecked === true ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>확인완료</span>
                      </>
                    ) : (
                      <span>중복확인</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  이름 / 닉네임 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="캘린더에 표시될 이름"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="최소 6자 이상"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Password Confirm */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={signupPasswordConfirm}
                    onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                    placeholder="비밀번호 다시 입력"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    required
                  />
                </div>
                {signupPasswordConfirm && (
                  <p
                    className={`mt-1 text-[11px] font-medium ${
                      signupPassword === signupPasswordConfirm
                        ? 'text-emerald-600'
                        : 'text-rose-500'
                    }`}
                  >
                    {signupPassword === signupPasswordConfirm
                      ? '✓ 비밀번호가 일치합니다.'
                      : '✕ 비밀번호가 일치하지 않습니다.'}
                  </p>
                )}
              </div>

              {/* Phone Verification Section */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  전화번호 인증 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => {
                        setSignupPhone(e.target.value)
                        setPhoneVerified(false)
                        setCodeSent(false)
                      }}
                      placeholder="01012345678"
                      disabled={phoneVerified}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:bg-slate-100"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode || phoneVerified || !signupPhone.trim()}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-xl flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
                  >
                    {sendingCode ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>{codeSent ? '재발송' : '인증번호 발송'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Verification Code Input */}
                {codeSent && !phoneVerified && (
                  <div className="mt-2.5 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
                    {devCodeHint && (
                      <div className="text-[11px] text-indigo-700 bg-white/80 px-2.5 py-1.5 rounded-lg border border-indigo-200 font-medium">
                        💡 <strong>[개발 모드 테스트용]</strong> 인증번호: <span className="font-mono text-indigo-900 font-bold tracking-wider">{devCodeHint}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                        placeholder="인증번호 6자리"
                        maxLength={6}
                        className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={verifyingCode || !phoneCode.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {verifyingCode ? '확인 중...' : '인증 확인'}
                      </button>
                    </div>
                  </div>
                )}

                {phoneVerified && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>전화번호 인증이 완료되었습니다.</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !phoneVerified || usernameChecked !== true}
                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>가입 처리 중...</span>
                  </>
                ) : (
                  <span>회원가입 완료</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
