import nodemailer from 'nodemailer'

/**
 * Creates and returns a Nodemailer transporter instance if SMTP configs are available.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 465
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465 || process.env.SMTP_SECURE === 'true',
      auth: {
        user,
        pass,
      },
      connectionTimeout: 5000, // 5초 초과 시 즉시 타임아웃 (무한 로딩 방지)
      greetingTimeout: 5000,
      socketTimeout: 7000,
    })
  }

  return null
}

/**
 * HTML Email Template for dailymate Verification Code
 */
function generateVerificationEmailHtml(code) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>dailymate 이메일 인증</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
              <div style="display: inline-block; padding: 10px 20px; background: rgba(255, 255, 255, 0.15); border-radius: 30px; backdrop-filter: blur(8px);">
                <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">✨ dailymate</span>
              </div>
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 18px 0 0 0; letter-spacing: -0.3px;">
                회원가입 이메일 인증
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
                안녕하세요! 일상을 스마트하게 계획하는 <strong>dailymate</strong>입니다.<br/>
                회원가입을 완료하기 위해 아래 6자리 인증번호를 화면에 입력해주세요.
              </p>

              <!-- Verification Code Box -->
              <div style="background-color: #f1f5f9; border-radius: 14px; border: 2px dashed #6366f1; padding: 22px; text-align: center; margin: 26px 0;">
                <span style="display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">
                  인증번호 (Verification Code)
                </span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4f46e5;">
                  ${code}
                </span>
              </div>

              <!-- Notice -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 14px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.5;">
                  ⏳ 본 인증번호는 발송 시점으로부터 <strong>3분간</strong> 유효합니다.<br/>
                  인증번호가 만료된 경우 재전송을 요청해주세요.
                </p>
              </div>

              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
                본인이 요청하지 않은 경우 이 메일을 안전하게 무시하시기 바랍니다.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 36px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0 0 6px 0;">
                © 2026 dailymate. All rights reserved.
              </p>
              <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
                https://dailymate.today · 일상과 일정을 가장 완벽하게
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Send Verification Email from dailymate
 * @param {string} to - Recipient email address
 * @param {string} code - 6-digit verification code
 * @returns {Promise<{ sent: boolean, devMock: boolean, devCode?: string }>}
 */
export async function sendVerificationEmail(to, code) {
  // 발신자 이름 및 주소: dailymate (네이버 등 SMTP 서비스의 발신자 일치 정책 지원)
  let senderEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@dailymate.today'
  if (senderEmail && !senderEmail.includes('@') && process.env.SMTP_HOST?.includes('naver')) {
    senderEmail = `${senderEmail}@naver.com`
  }
  const from = `dailymate <${senderEmail}>`
  const subject = '[dailymate] 회원가입 이메일 인증번호 안내'
  const html = generateVerificationEmailHtml(code)

  const transporter = createTransporter()

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: `[dailymate] 회원가입 인증번호는 [${code}] 입니다. 3분 이내에 입력해주세요. (https://dailymate.today)`,
        html,
      })
      console.log(`[dailymate EMAIL] Sent to ${to} (MessageId: ${info.messageId})`)
      return { sent: true, devMock: false }
    } catch (err) {
      console.error(`[dailymate EMAIL Error] SMTP 전송 실패:`, err.message)
      if (err.code === 'ETIMEDOUT' || err.message?.includes('timeout') || err.message?.includes('Greeting')) {
        throw new Error('이메일 서버 연결 시간 초과입니다. 네이버 계정의 [해외 로그인 차단] 설정을 해제했는지 확인해주세요.')
      }
      throw new Error(`이메일 발송 실패 (${err.message})`)
    }
  }

  // SMTP 설정이 없거나 실패한 경우 (개발/테스트 모드 안내)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`[dailymate 이메일 발송 - 개발/테스트 모드]`)
  console.log(`발신자: ${from}`)
  console.log(`수신자: ${to}`)
  console.log(`인증번호: [ ${code} ]`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  return { sent: true, devMock: true, devCode: code }
}
