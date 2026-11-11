# RouteCraft

RouteCraft는 여행자가 여행 조건과 방문하고 싶은 장소를 직접 정리하고, 계정에 여행 플랜을 저장해 관리하는 웹 앱입니다.

여행을 준비할 때 여러 사이트에서 정보를 찾아 일정을 구성하고, 방문 장소나 조건이 바뀔 때 일정을 다시 정리해야 하는 번거로움을 줄이는 것을 목표로 합니다.

## 현재 구현된 기능

- 회원가입, 로그인, 로그아웃
- BCrypt 비밀번호 해시 저장 및 서버 세션 로그인
- 여행 플랜 생성, 목록·상세 조회, 수정, 삭제
- 여행지, 날짜, 기간, 인원, 이동수단, 메모 관리
- 방문 장소와 날짜별 방문 예정 시간 관리
- 플랜 작성 화면의 3단계 슬라이드 입력
- 서울·도쿄의 지역 선택 예시 지도와 장소 선택

현재 버전은 기본 계정과 여행 플랜 관리에 초점을 둡니다. 생성형 AI, 실제 장소 검색, 지도 경로 및 이동시간 API는 연결되어 있지 않습니다. 지역 지도와 장소 목록은 선택 UI를 위한 예시 데이터입니다.

## 기술 스택

- Frontend: React 19, TypeScript, Vite 8, Tailwind CSS 4
- Backend: Java 17, Spring Boot 3.5, Spring Data JPA
- Database: H2 파일 데이터베이스
- Design: Figma Make 산출물 및 설정 (`frontend/.figma`)

## 실행 방법

필요 도구: Node.js 22, pnpm 10.34.3, Java 17 이상, Maven

### 백엔드

```bash
cd backend
mvn spring-boot:run
```

API 서버는 `http://localhost:8080`에서 실행됩니다. H2 데이터베이스는 `backend/data/routecraft.mv.db`에 생성됩니다.

### 프론트엔드

```bash
cd frontend
pnpm install
pnpm dev
```

프론트엔드는 `http://localhost:8443`에서 실행되며, Vite가 `/api` 요청을 백엔드로 전달합니다.

## API

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/me` | 로그인 사용자 확인 |
| GET | `/api/plans` | 내 플랜 목록 |
| POST | `/api/plans` | 플랜 생성 |
| GET | `/api/plans/{id}` | 플랜 상세 |
| PUT | `/api/plans/{id}` | 플랜 수정 |
| DELETE | `/api/plans/{id}` | 플랜 삭제 |

여행 플랜은 사용자 계정에 연결되고, 방문 장소는 플랜에 종속되어 저장됩니다. 로컬 DB 파일, 빌드 결과물, 의존성 폴더, `.env` 파일은 Git에서 제외합니다.
