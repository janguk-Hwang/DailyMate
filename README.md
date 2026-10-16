# 📅 To-Do 캘린더 (Todo Calendar App)

[![Live Demo](https://img.shields.io/badge/Demo-Railway-success?style=flat&logo=railway)](https://todo-calendar-app-production.up.railway.app/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey?style=flat&logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=flat&logo=mysql)](https://www.mysql.com/)

> **스마트한 개인 맞춤형 일정 & 플래너 웹 애플리케이션**  
> React 19, Tailwind CSS v4, Express, MySQL을 기반으로 제작된 날짜별 할 일 관리 및 캘린더 서비스입니다.  
> 🔗 **서비스 바로가기**: [https://todo-calendar-app-production.up.railway.app/](https://todo-calendar-app-production.up.railway.app/)

---

## ✨ 핵심 기능

### 1. 📆 반응형 월간 캘린더 (Interactive Calendar)
- **월간 뷰 & 진행 현황**: 달력 날짜별 등록된 일정 수 및 완료 현황 뱃지 실시간 표시
- **터치 & 드래그 인터랙션**: 모바일 화면 좌우 스와이프 및 마우스 드래그를 통한 월 이동 지원
- **'오늘' 바로가기**: 클릭 한 번으로 오늘 날짜 및 해당 월로 즉시 이동

### 2. 📝 스마트 일정 등록 & 다중 입력
- **쉼표(`,`) 구분 다중 일정 동시 등록**: `운동하기, 독서, 장보기`와 같이 쉼표로 입력 시 여러 개의 일정이 개별 생성
- **다중 / 반복 일정 모달 (기간 / 반복 등록)**:
  - **연속 기간 등록 (Range)**: 시작일과 종료일을 지정하여 매일 일괄 등록
  - **매주 요일 반복 (Weekly)**: 특정 요일(예: 매주 화/목)을 선택하여 반복 일정 일괄 생성
  - **다중 날짜 선택 (Custom)**: 원하는 특정 일자들을 직접 골라 한 번에 등록
  - *모든 다중 등록 모드에서도 쉼표(`,`)를 통한 복수 일정 동시 생성을 완벽 지원*

### 3. 📄 일정 상세 & 메모 모달 (Note & Detail Modal)
- **통합 상세 뷰어 및 편집기**: 일정 카드 또는 수정(✏️) 아이콘 클릭 시 상세 모달 오픈
- **상세 메모 (Description)**: 여러 줄 텍스트 메모, 링크, 준비물, 장소 등을 자유롭게 작성 및 줄바꿈 지원
- **원스톱 정보 수정**: 모달 내에서 제목, 우선순위, 상세 메모를 한 곳에서 즉시 수정 후 저장
- **카드 메모 뱃지**: 메모가 존재하는 일정은 카드에 **📝 메모 뱃지** 및 첫 줄 프리뷰 표시

### 4. ⚡ 편리한 일정 관리 & 인터랙션
- **선택된 날 일정 '모두 선택'**: 선택된 날짜의 모든 일정을 한 번에 완료/미완료 토글
- **완료 항목 일괄 삭제**: 클릭 한 번으로 해당 일자의 완료된 일정 일괄 정리
- **우선순위 관리**: 일정별 🔴 높음, 🟡 보통, 🟢 낮음 설정 및 수정 지원
- **드래그 앤 드롭 (Drag & Drop)**: 일정 카드를 끌어다 놓아 순서 재배치 및 DB 순서 영속화
- **필터 & 정렬 & 검색**:
  - 상태별(전체 / 진행 / 완료) 필터링
  - 우선순위 순, 등록 순(최신순/오래된순) 정렬
  - 실시간 키워드 검색

### 5. 🔒 계정 인증 & 개인 비공개 보안 (Auth)
- **소셜 로그인**: Google, 카카오톡, 네이버 OAuth 2.0 간편 로그인
- **일반 계정 회원가입/로그인**: 아이디 중복 체크, CoolSMS 휴대전화 번호 문자 인증번호 연동
- **비공개 일정 격리**: JWT 토큰 기반 인증으로 로그인한 본인의 개인 일정만 안전하게 암호화 및 격리 보관

### 6. 👤 마이페이지 & 생산성 통계 (My Page & Productivity)
- **프로필 커스터마이징**: 아바타 아이콘 선택 및 닉네임 수정
- **생산성 & 달성률 대시보드**: 누적 일정 등록/완수 수치, 누적 달성률(%), 연속 완수 스트릭(Streak 🔥) 일수, 이번 달 완수율 실시간 집계
- **데이터 백업 및 다운로드**: 내 일정 전체 JSON 백업 및 엑셀(CSV) 내보내기 지원
- **데이터 일괄 정리**: 모든 날짜에 걸친 완료 일정 일괄 삭제 정리 기능
- **계정 및 보안 관리**: 일반 계정 비밀번호 변경 및 회원 탈퇴(위험 구역 데이터 영구 파기)

### 7. ⚙️ 캘린더 환경설정 & 개인화 (Preferences)
- **달력 시작 요일 설정**: 일요일 시작(`일~토`) 또는 월요일 시작(`월~일`) 선택
- **새 일정 기본 우선순위**: 높음 / 보통 / 낮음 기본값 설정
- **완료된 일정 표시 방식**: 취소선 유지 / 자동 맨 아래 배치 / 목록에서 자동 숨김
- **화면 밀도 (Density)**: 기본 뷰(편안하게) / 컴팩트 뷰(조밀하게)
- **로컬 & 클라우드 동기화**: 비로그인 게스트는 로컬스토리지 유지, 회원은 DB 영속화

---

## 🛠️ 기술 스택 (Tech Stack)

| 영역 | 기술 스택 |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React |
| **Backend** | Node.js, Express 5, jsonwebtoken, bcryptjs, cors |
| **Database** | MySQL 8.0+ (mysql2 Connection Pool, UTF-8mb4) |
| **Deployment** | Railway (Fullstack Web App + MySQL Database) |

---

## 📁 프로젝트 구조

```text
├── public/                 # 정적 리소스
├── server/
│   ├── index.js            # Express 서버 및 스케줄 API 엔드포인트
│   ├── db.js               # MySQL 커넥션 풀 및 자동 테이블 마이그레이션
│   ├── middleware/         # JWT 인증 미들웨어 (authMiddleware)
│   └── routes/             # 일반 인증 및 OAuth 라우터 (auth.js, oauth.js)
├── src/
│   ├── components/
│   │   ├── CalendarView.jsx        # 인터랙티브 캘린더 컴포넌트
│   │   ├── TodoInput.jsx           # 쉼표 구분 다중 일정 입력 폼
│   │   ├── TodoItem.jsx            # 일정 카드 (드래그, 메모 뱃지, 상태 토글)
│   │   ├── TodoFilter.jsx          # 상태 필터, 우선순위/등록순 정렬, 검색
│   │   ├── TodoDetailModal.jsx     # 일정 상세 보기 및 메모 통합 편집 모달
│   │   ├── MultiScheduleModal.jsx  # 기간/요일반복/다중날짜 일괄 등록 모달
│   │   ├── AuthModal.jsx           # 로그인, 회원가입, SMS인증, 소셜 로그인 모달
│   │   ├── Header.jsx              # 날짜별 달성률 프로그레스 바
│   │   └── Navbar.jsx              # 상단 네비게이션 및 사용자 프로필
│   ├── services/
│   │   └── api.js                  # 백엔드 API 통신 서비스 함수 모음
│   ├── App.jsx                     # 메인 애플리케이션 상태 및 흐름
│   ├── main.jsx                    # React 진입점
│   └── index.css                   # 글로벌 스타일
├── .env.example            # 환경 변수 템플릿
├── package.json            # 의존성 및 스크립트 정의
└── vite.config.js          # Vite 번들러 및 프록시 설정
```

---

## 🚀 로컬 개발 및 실행 방법

### 1. 의존성 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 MySQL 및 환경 정보를 입력합니다:
```bash
cp .env.example .env
```

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=todo_calendar_db

JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173

# 소셜 로그인 설정 (선택 사항)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

### 3. 애플리케이션 실행
- **프론트엔드 개발 서버:**
  ```bash
  npm run dev
  ```
- **백엔드 API 서버:**
  ```bash
  npm run server
  ```
- **프로덕션 빌드 및 통합 실행:**
  ```bash
  npm run build
  npm start
  ```
  *(기본 포트: `http://localhost:3001`에서 프론트엔드와 백엔드가 함께 제공됩니다)*

---

## 📄 라이선스
MIT License © [janguk-Hwang](https://github.com/janguk-Hwang)
