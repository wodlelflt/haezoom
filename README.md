# haezoom

브라우저에서 문서 이미지와 PDF를 OCR로 읽고, 로컬 Node.js 서버를 통해 Claude, Gemini 또는 OpenAI API로 해야 할 일과 제출 정보를 추출하는 도구입니다.

## 실행

Node.js 18 이상이 필요합니다. 사용할 AI 제공자에 맞춰 저장소 루트의 `.env` 파일을 설정합니다. Claude API 키는 Anthropic Console에서 발급받습니다:

```env
AI_PROVIDER=claude
ANTHROPIC_API_KEY=발급받은_API_키
CLAUDE_MODEL=claude-haiku-5-5
```

Gemini를 사용하려면 `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, `GEMINI_MODEL`을 설정하고, OpenAI를 사용하려면 `AI_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_MODEL`을 설정합니다. 기존 `.env` 호환성을 위해 `AI_PROVIDER`를 생략하면 OpenAI를 사용합니다.

그다음 로컬 서버를 실행합니다:

```bash
npm start
```

`http://127.0.0.1:8000`에 접속합니다. `.env`는 Git에서 무시됩니다. 웹앱의 OCR 엔진과 PDF.js는 CDN에서 불러옵니다.

## 사용

1. 프로젝트 루트의 `.env`에 선택한 제공자의 API 키와 모델을 입력하고 서버를 다시 시작합니다.
2. PDF 또는 PNG/JPG/WEBP 문서를 올리고 `문서 분석`을 누릅니다.
3. 일정, 할 일 목록과 OCR 원문을 확인하거나 JSON으로 내려받습니다. JSON 결과는 `schedules`와 `tasks` 배열을 포함합니다. 일정 항목은 `title`, `date`, `time`, `location`, `details`, `evidence`, `needs_review`를 포함하며, 할 일 항목은 `title`, `action`, `deadline`, `materials`, `cost`, `submission`, `evidence`, `needs_review`를 포함합니다. 문서에서 확인할 수 없는 값은 `null` 또는 빈 배열로 표시하고, 검토가 필요한 항목은 `needs_review`가 `true`입니다.

이미지 OCR은 브라우저에서 수행하며, OCR 단어 좌표로 문서의 행과 열을 재구성합니다. PDF는 내장 텍스트의 위치 정보를 우선 사용하고, 스캔 페이지는 OCR 좌표로 표 구조를 읽습니다. 좌표 기반 표 구조와 OCR 원문은 분석을 위해 선택한 AI 제공자에게 전송됩니다. PDF는 30페이지, 파일은 20MB까지 지원합니다. 서버는 `127.0.0.1`에서만 열리며, API 키는 서버의 `.env`에서만 읽습니다. 문서 파일 자체는 서버에 업로드되지 않습니다.

## Chrome 확장 프로그램

1. 위 실행 절차대로 `.env`를 설정하고 `npm start`로 로컬 AI 서버를 계속 실행합니다.
2. Chrome에서 `chrome://extensions`를 열고 개발자 모드를 켠 뒤 `압축해제된 확장 프로그램을 로드합니다`를 눌러 저장소 폴더를 선택합니다.
3. 확장 아이콘을 누르고 `PDF·이미지 문서 분석하기`를 선택하면 문서 분석 탭이 열립니다. PDF와 PNG/JPG/WEBP를 분석할 수 있습니다.

확장 프로그램은 PDF.js와 OCR 엔진을 로컬 리소스로 포함하고, OCR 언어 데이터는 첫 사용 시 내려받습니다. OCR은 브라우저에서 수행하며 추출한 텍스트와 표 구조만 로컬 서버로 보냅니다. 기존 `현재 문서 분석하기` 웹페이지 분석과 Google Calendar 기능도 팝업에 유지됩니다.