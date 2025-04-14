import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioStation, Game } from '@/types'; // types/index.ts 에서 가져오기
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Volume2,
  VolumeX,
  AlertTriangle,
  Loader2,
  Bookmark,
} from 'lucide-react';

// Player 컴포넌트 Props 인터페이스 정의
interface PlayerProps {
  activeStation: RadioStation | null;
  activeGame: Game | null;
  isPlaying: boolean;
  // playStation 시그니처: Home 컴포넌트의 playStation 타입과 일치해야 함
  playStation: (station: RadioStation, game: Game | null) => void;
  stopStation: () => void;
  handlePrevStation: () => void;
  handleNextStation: () => void;
  handleRandomStation: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  stations: RadioStation[]; // 이전/다음/랜덤 버튼 활성화용
  currentSong: string | null; // Home에서 받음
  isLoadingSong: boolean; // Home에서 받음
  isSongUnavailable: boolean; // Home에서 받음
  onSaveSong: () => void; // 저장 버튼 클릭 시 호출될 함수
}

export const Player: React.FC<PlayerProps> = ({
  activeStation,
  activeGame,
  isPlaying,
  playStation, // playStation 함수 받기 (타입 주의)
  stopStation,
  handlePrevStation,
  handleNextStation,
  handleRandomStation,
  volume,
  setVolume,
  stations,
  currentSong,
  isLoadingSong,
  isSongUnavailable,
  onSaveSong,
}) => {
  const volumeIcon = volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />;
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const isControlDisabled = stations.length === 0 || !activeStation;
  const canSaveSong = !isLoadingSong && currentSong && activeStation;

  const handleSaveClick = () => {
    if (canSaveSong) {
      onSaveSong();
      setShowSavedFeedback(true);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (showSavedFeedback) {
      timer = setTimeout(() => {
        setShowSavedFeedback(false);
      }, 1500); // 1.5초 후 피드백 숨김
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showSavedFeedback]);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-secondary/80 backdrop-blur-md border-t border-border z-10 shadow-lg">
      <div className="container mx-auto p-4 flex items-center justify-between gap-4">
        {/* 스테이션 정보 */}
        <div className="flex-shrink min-w-0 max-w-xs md:max-w-sm lg:max-w-md">
          {activeStation ? (
            <div>
              <h2 className="text-lg font-semibold truncate" title={activeStation.name}>{activeStation.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                 <span className="flex-grow truncate">
                    {isLoadingSong ? (
                    <span className="flex items-center text-xs">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Loading...
                    </span>
                    ) : currentSong ? (
                    <span title={currentSong}>{currentSong}</span>
                    ) : isSongUnavailable ? (
                    <span className="flex items-center text-xs text-yellow-600 dark:text-yellow-500">
                        <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                        Info unavailable
                    </span>
                    ) : (
                    activeStation.genre
                    )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-5 w-5 p-0 flex-shrink-0",
                    !canSaveSong && "opacity-30 cursor-not-allowed",
                    showSavedFeedback && "text-primary"
                  )}
                  onClick={handleSaveClick}
                  disabled={!canSaveSong}
                  title={canSaveSong ? "Save this song" : "Cannot save song"}
                >
                  <Bookmark
                    className={cn(
                      "h-4 w-4",
                      showSavedFeedback ? "fill-current" : "fill-none"
                    )}
                  />
                </Button>
                <span className="mx-1 flex-shrink-0">|</span>
                <span className="flex-shrink-0">{activeGame}</span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No station selected</p>
          )}
        </div>

        {/* 재생 컨트롤 */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handlePrevStation} disabled={isControlDisabled}>
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            // onClick 수정: activeGame이 null일 수 있으므로 Home에서 처리하도록 함
            onClick={activeStation ? (isPlaying ? stopStation : () => playStation(activeStation, activeGame!)) : undefined}
            disabled={!activeStation}
            className="w-10 h-10"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextStation} disabled={isControlDisabled}>
            <SkipForward className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRandomStation} disabled={stations.length === 0}>
             <Shuffle className="h-5 w-5" />
          </Button>
        </div>

        {/* 볼륨 컨트롤 */}
        <div className="flex items-center space-x-2 w-32">
          {volumeIcon}
          <Slider
            min={0}
            max={100}
            step={1}
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            aria-label="Volume"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};