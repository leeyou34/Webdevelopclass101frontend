<h1 align="center">Todo Application · 화면 (v2)</h1>

> **2026년 10월 업그레이드판입니다.**
> 2021–22년에 책을 따라 처음 만든 버전은 [`legacy-2022` 브랜치](https://github.com/leeyou34/Webdevelopclass101frontend/tree/legacy-2022)에 그대로 남겨 두었습니다.
>
> 서버(백엔드)와 프로그램 설명·장점·응용 방안: [Webdevelopclass101](https://github.com/leeyou34/Webdevelopclass101)

---

## 이 화면이 하는 일

- **회원가입** — 이름, 이메일, 비밀번호(8자 이상), 필요하면 초대 코드
- **로그인** — 성공하면 내 할 일 목록으로 이동
- **내 할 일** — 추가, 완료 표시(체크), 글자 눌러 고치기(Enter 저장 · Esc 취소), 삭제, 남은 일 개수 표시
- 로그인이 만료되면 자동으로 로그인 화면으로 돌아갑니다.
- 휴대폰 화면에서도 같은 기능을 쓸 수 있습니다.

## 2022 → 2026 무엇이 달라졌나

| 구분 | 2022 학습 버전 | 2026 업그레이드 |
|---|---|---|
| 개발 도구 | Create React App (지원 종료) | Vite |
| 라이브러리 | React 17, Material-UI v4 | React 19, MUI v9, React Router |
| 코드 구조 | 클래스 컴포넌트, 책 실습 주석 위주 | 함수 컴포넌트, 화면별 파일 분리 |
| 로그아웃 | 토큰 자리에 `"null"` 문자열이 저장되어 다음 요청에 `Bearer null`이 전송됨 | 토큰을 지움 |
| 오류 표시 | 콘솔 출력만 | 화면에 서버 메시지 표시 (비밀번호 틀림, 초대 코드 오류 등) |
| 할 일 수정 | Enter로만 저장 | Enter·바깥 클릭 저장, Esc 취소, 빈 값 저장 방지 |
| 서버 주소 | localhost일 때만 지정 | `VITE_API_BASE_URL`로 지정, 없으면 localhost는 `:8080`, 그 밖은 같은 도메인 |
| 테스트 | 기본 생성 파일 | 로그인·가입·할 일 전체 흐름 테스트 5개 + GitHub Actions |

## 실행 방법

필요한 것: **Node.js 22** 이상, 그리고 [백엔드](https://github.com/leeyou34/Webdevelopclass101) 실행(`http://localhost:8080`)

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 자동 테스트
npm run build      # 배포용 파일 → dist/
```

다른 주소의 서버에 붙이려면 `.env.example`을 `.env`로 복사하고 `VITE_API_BASE_URL`을 적습니다.

## 출처와 작업 기록

- 처음 버전(2021–22)은 『React.js, 스프링 부트, AWS로 배우는 웹 개발 101』(에이콘출판사)을 따라 만들었습니다.
- 2026년 업그레이드는 AI(Claude)와 함께 진행했습니다.
