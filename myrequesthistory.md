# 요청 사항 기록 (My Request History)

## 2025-10-09

### 법인 추가 과정 메뉴 구현 요청

**배경:**
- corp-kanban 프로젝트에서 회계보드 메뉴 > 법인카드에 환경변수 입력 기능이 있음
- 환경변수 입력 시 앱스크립트 코드와 시트, 각 시트의 1행을 복사하는 프로세스가 진행됨

**요청 사항:**
1. "법인 추가 과정"이라는 별도 메뉴 생성
2. 현재 법인카드에서 진행되는 과정을 시각적으로 볼 수 있도록 구현
3. 실시간 진행 상황 표시를 위해 SSE (Server-Sent Events) 구현 필요

**현재 상태:**
- Mock 데이터로 작동 중
- 실제 연결을 위해서는 SSE 구현 필요

**구현 목표:**
- 법인 추가 과정을 단계별로 시각화
- 실시간 진행 상황 피드백 제공
- 각 단계(앱스크립트 코드 복사, 시트 복사, 1행 복사) 진행 상태 표시

### 구현 완료 사항

**1. 타입 정의 (lib/types.ts)**
- ProgressStep: 각 진행 단계의 타입
- ProgressItem: 전체 진행 상황의 타입
- ProgressEvent: SSE 이벤트 타입

**2. SSE 스트림 API (app/api/progress/stream/route.ts)**
- Edge Runtime 기반 실시간 스트리밍
- 클라이언트 연결 관리
- 진행 상황 브로드캐스트 기능
- 30초마다 heartbeat 전송

**3. 법인 추가 API (app/api/corporations/add/route.ts)**
- 5단계 프로세스 구현:
  1. 환경변수 생성
  2. Google Drive 폴더 생성
  3. 스프레드시트 생성
  4. Apps Script 복사
  5. 시트 1행 복사
- 각 단계별 진행 상황 SSE로 실시간 전송
- Google APIs 연동 (Drive, Sheets, Script)

**4. Progress 페이지 (app/progress/page.tsx)**
- SSE 실시간 연결
- 진행 상황 시각화
- 연결 상태 표시
- 자동 재연결 기능

**5. 네비게이션**
- Sidebar에 "법인 추가 과정" 메뉴 추가
- 모바일 반응형 지원

**6. 메인 페이지 연동**
- 법인 추가 시 API 호출
- 자동으로 진행 상황 페이지로 이동

### 사용 방법
1. 회계보드에서 "새 법인 추가" 클릭
2. 법인명과 환경키 입력
3. 저장 시 자동으로 "법인 추가 과정" 페이지로 이동
4. 실시간으로 진행 상황 확인

---

### 칸반보드 개선 및 접근 권한 관리 기능 추가 요청

**요청 사항:**
1. 법인카드 UI 간소화
   - "은행거래내역 폴더"와 스프레드시트 이름만 표시
   - 마우스 호버 시 강조 표시
   - 클릭 시 해당 URL로 이동
   - ID, Apps Script 링크 등 불필요한 정보 제거

2. 칸반보드 커스터마이징
   - 새로운 보드 추가 기능
   - 보드 이름 편집 기능
   - 보드 삭제 기능 (기본 보드 제외)
   - 보드 접기/펼치기 기능

3. Drag and Drop 기능
   - 법인카드를 보드 간 드래그하여 이동
   - 드래그 시 시각적 피드백 제공
   - 드롭 영역 하이라이트

4. 접근 권한 관리
   - 설정 페이지에 전역 접근 권한 관리 추가
   - 각 법인카드별 개별 접근 권한 관리
   - 구글 계정 이메일 추가/제거 기능

### 구현 완료 사항

**1. 법인카드 UI 간소화 (components/CorporationCard.tsx)**
- 은행거래내역 폴더 링크: FolderOpen 아이콘과 함께 표시
- 스프레드시트 링크: FileSpreadsheet 아이콘과 함께 표시
- 호버 효과: hover:bg-blue-50, hover:text-blue-600
- ID, Apps Script 링크, 복사 버튼 등 모두 제거

**2. 타입 정의 업데이트 (lib/types.ts)**
```typescript
// 칸반보드 인터페이스 추가
export interface KanbanBoard {
  id: string
  title: string
  order: number
  collapsed: boolean
  createdAt: string
  updatedAt: string
}

// CorporationCard에 필드 추가
boardId: string
allowedEmails?: string[]
```

**3. Drag and Drop 라이브러리 설치**
- @dnd-kit/core: 핵심 드래그 앤 드롭 기능
- @dnd-kit/sortable: 정렬 가능한 리스트
- @dnd-kit/utilities: 유틸리티 함수

**4. 전역 상태 관리 (lib/store.ts)**
- 보드 관리 상태 추가
- localStorage에 보드 설정 영구 저장 (persist middleware)
- 기본 보드 생성: active, inactive, archived
- 보드 관리 액션:
  - addBoard: 새 보드 추가
  - updateBoard: 보드 정보 수정
  - deleteBoard: 보드 삭제 (기본 보드 보호)
  - toggleBoardCollapsed: 보드 접기/펼치기
  - moveCard: 카드를 다른 보드로 이동

**5. 메인 페이지 Drag and Drop 구현 (app/page.tsx)**
- DndContext로 전체 드래그 앤 드롭 컨텍스트 설정
- PointerSensor 사용 (8px 이동 후 드래그 시작)
- closestCorners 충돌 감지 알고리즘
- handleDragStart: 드래그 시작 시 activeCard 상태 설정
- handleDragEnd: 드롭 시 카드 이동 처리
- DragOverlay: 드래그 중인 카드 시각 효과 (회전, 투명도)
- 보드 관리 패널: 보드 추가, 이름 변경, 삭제 기능

**6. Droppable 보드 컴포넌트 (components/DroppableBoard.tsx)**
- useDroppable 훅으로 드롭 영역 설정
- SortableContext로 카드 정렬 가능
- 보드 색상: 상태별 gradient (green, yellow, gray)
- 드롭 영역 하이라이트: isOver 시 bg-blue-100
- 헤더 클릭으로 접기/펼치기
- ChevronDown/ChevronUp 아이콘으로 상태 표시

**7. Draggable 카드 컴포넌트 (components/DraggableCard.tsx)**
- useSortable 훅으로 드래그 가능하게 설정
- 드래그 중 opacity: 0.5
- CSS Transform으로 부드러운 이동 애니메이션

**8. 접근 권한 관리 - 전역 (app/settings/page.tsx)**
- 접근 권한 관리 섹션 추가
- 이메일 주소 입력 필드
- 이메일 추가 버튼 (Plus 아이콘)
- 이메일 목록 표시 (purple-50 배경)
- 이메일 삭제 버튼 (Trash2 아이콘)
- 이메일 형식 검증 (@ 포함 여부)
- Enter 키로 이메일 추가 가능

**9. 접근 권한 관리 - 법인별 (components/AddCardModal.tsx)**
- 법인 추가/수정 모달에 접근 권한 관리 섹션 추가
- allowedEmails 상태 관리
- 이메일 추가/제거 기능
- 폼 제출 시 allowedEmails 포함
- 편집 시 기존 이메일 목록 로드
- 스크롤 가능한 이메일 목록 (max-h-32)

### 주요 기능

**칸반보드 관리:**
- 기본 보드 (active, inactive, archived) 3개 제공
- 사용자 정의 보드 무제한 추가 가능
- 보드 이름 자유롭게 변경
- 기본 보드 외 삭제 가능
- 보드별 접기/펼치기로 화면 공간 효율적 사용
- localStorage에 보드 설정 저장으로 세션 유지

**Drag and Drop:**
- 직관적인 드래그 앤 드롭 인터페이스
- 드래그 중 시각적 피드백 (투명도, 회전)
- 드롭 영역 하이라이트
- 부드러운 애니메이션 효과
- 8px 이동 후 드래그 시작으로 오작동 방지

**접근 권한:**
- 전역 접근 권한: 모든 법인에 적용되는 공통 계정
- 법인별 접근 권한: 특정 법인만 접근 가능한 계정
- 이메일 형식 검증
- 실시간 추가/제거
- 직관적인 UI (purple 테마)

### 사용 방법

**칸반보드 관리:**
1. 메인 페이지 상단 "보드 관리" 버튼 클릭
2. "보드 추가" 버튼으로 새 보드 생성
3. 보드 이름 옆 설정 아이콘으로 이름 변경
4. 휴지통 아이콘으로 보드 삭제 (기본 보드 제외)
5. 보드 헤더 클릭으로 접기/펼치기

**법인카드 이동:**
1. 법인카드를 클릭하여 드래그 시작
2. 원하는 보드로 드래그
3. 드롭하여 보드 이동

**접근 권한 관리:**
1. 전역 권한: 설정 > 접근 권한 관리에서 이메일 추가
2. 법인별 권한: 법인 추가/수정 시 접근 권한 섹션에서 이메일 추가
3. 이메일 주소 입력 후 "추가" 버튼 클릭 또는 Enter 키
4. 삭제 아이콘으로 이메일 제거

---
