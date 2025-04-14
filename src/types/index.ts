import { RadioStation } from "@/services/radio-parser";

// 저장된 곡 타입 정의
export interface SavedSong {
  id: number; // 타임스탬프 사용
  title: string;
  artist?: string; // 파싱 성공 시 저장
  stationName: string;
  savedAt: number; // 타임스탬프
  streamUrl: string; // 원본 스트림 URL (중복 저장 방지 등에 사용 가능)
}

// 필요한 경우 다른 공유 타입을 여기에 추가할 수 있습니다.
// 예: Player 컴포넌트가 받는 props 타입 (선택적)
// export interface PlayerComponentProps { ... }

// RadioStation과 Game 타입은 radio-parser.ts에서 가져와서 사용합니다.
export type { RadioStation, Game } from "@/services/radio-parser";