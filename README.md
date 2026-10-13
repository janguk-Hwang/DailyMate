# 📅 Daily Schedule & To-Do List (React + MySQL)
https://todo-calendar-app-production.up.railway.app/

React, Tailwind CSS, Express, 그리고 MySQL을 활용한 모던 풀스택 날짜별 일정 관리 웹 애플리케이션입니다.

---

## ✨ 주요 기능
- **월간 캘린더 (Calendar View)**: 월별 이동, '오늘' 바로가기, 일자별 일정 개수 및 달성 현황 배지 표시
- **날짜별 일정 관리**: 특정 날짜를 클릭하여 해당 일자의 할 일 등록, 우선순위(높음/보통/낮음) 설정
- **할 일 완료 / 수정 / 삭제**: 인라인 수정 지원 및 완료 항목 일괄 삭제
- **진행률 프로그레스 바**: 선택한 일자의 일정 달성률 실시간 반영
- **MySQL 데이터베이스 연동**: 영속적인 데이터 보관 및 테이블 자동 초기화

---

## 🛠️ 기술 스택
- **Frontend**: React 19, Tailwind CSS v4, Lucide React, Vite
- **Backend**: Node.js, Express, mysql2 (Connection Pool)
- **Database**: MySQL 8.0+

---

## 🚀 로컬 실행 방법

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 본인의 MySQL 접속 정보를 입력합니다.
```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=todo_calendar_db
```

### 3. 서버 실행
- **프론트엔드 개발 서버:**
  ```bash
  npm run dev
  ```
- **백엔드 API 서버:**
  ```bash
  npm run server
  ```
- **프로덕션 통합 실행:**
  ```bash
  npm run build
  npm start
  ```
