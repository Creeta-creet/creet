# creet — Claude Code 스킬 스캐너 & 플러그인 시스템

설치된 모든 플러그인(Skills, MCP tools, LSP servers)을 스캔하여 최적의 스킬을 추천·실행하는 Claude Code 확장 시스템.

- `/c` — 단일 최적 스킬 추천 및 실행
- `/cc` — 관련 스킬 전체 병렬 실행 후 결과 합성

---

## GitHub

- [Creeta-creet/creet](https://github.com/Creeta-creet/creet) (private)

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 런타임 | Node.js |
| 플랫폼 | Claude Code hooks |
| 스킬 스캔 | `skill-scanner.js` |
| 메모리 | `memory-store.js` (`~/.claude/creet/`) |
| 진입점 | `hooks/` (UserPromptSubmit, SessionStart 등) |

---

## 폴더 구조

```
creet/
├── hooks/          # Claude Code hook 핸들러
├── lib/            # 핵심 라이브러리 (scanner, memory, handler)
├── scripts/        # 유틸리티 스크립트
├── skills/         # 번들 스킬 (c, cc 등)
├── creet.config.json
└── CHANGELOG.md
```

---

## 주요 파일

| 파일 | 역할 |
|------|------|
| `lib/skill-scanner.js` | 플러그인 캐시 탐색, 스킬 목록 수집 |
| `lib/memory-store.js` | 세션 메모리 영속화 (`~/.claude/creet/`) |
| `lib/user-prompt-handler.js` | UserPromptSubmit 이벤트 처리 |
| `skills/c/SKILL.md` | `/c` 스킬 정의 |
| `skills/cc/SKILL.md` | `/cc` 스킬 정의 (병렬 멀티 에이전트) |

---

## Change Log

### 2026-02-25 (v1.5.0)
- **크로스플랫폼 호환성 수정 + 버전 동기화**
  - `user-prompt-handler.js`: `/dev/stdin` → `fs.readFileSync(0)` — Windows에서 `UserPromptSubmit` 훅 완전 동작 안 하던 버그 수정
  - `skill-scanner.js`: 하드코딩된 플러그인 캐시 경로 → 4단계 env var fallback (`CLAUDE_PLUGIN_CACHE_DIR` → `CLAUDE_PLUGIN_ROOT` 추론 → `CLAUDE_HOME/plugins/cache` → `~/.claude/plugins/cache`)
  - `memory-store.js`: `process.cwd()` → `~/.claude/creet/` 고정 경로 (작업 디렉토리 변경 시 메모리 유실 방지)
  - 버전 문자열 불일치 수정: `hooks.json`, `session-start.js` v1.3.0 → v1.5.0 통일
  - 7개 파일 커밋 후 GitHub push 완료

### 2026-02-24 (v1.4.0)
- `/cc` — Creet Multi 신규 스킬 추가 (병렬 멀티 에이전트 실행)
  - N ≤ 5 매칭 스킬: 자동 실행
  - N > 5 매칭 스킬: AskUserQuestion으로 확인 후 실행
  - 결과 합성: 일치점, 충돌점, 권장 다음 단계 정리
- `session-start.js`: `/c` + `/cc` 동등 표시
- `skills/design-council/SKILL.md` 제거 (README 예시로 이동)
