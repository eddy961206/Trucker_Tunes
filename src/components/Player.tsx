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
  RefreshCw, // 새로고침 아이콘 추가
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
  onRefreshSong: () => void; // 새로고침 함수 prop 추가
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
  onRefreshSong, // prop 받기
}) => {
  const volumeIcon = volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />;
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const isControlDisabled = stations.length === 0 || !activeStation;
  const canSaveSong = !isLoadingSong && currentSong && activeStation;
  // 새로고침 버튼 활성화 조건 추가
  const canRefreshSong = !isLoadingSong && activeStation;

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
        {/* md 이상일 때 max-w-md, 기본 max-w-xs */}
        <div className="flex-shrink min-w-0 max-w-xs md:max-w-sm lg:max-w-md">
          {activeStation ? (
            <div>
               {/* Station Name Wrapper for Marquee */}
               <div className="overflow-hidden w-full whitespace-nowrap"> {/* 부모에 overflow, nowrap */}
                <h2
                  className="text-lg font-semibold animate-marquee md:animate-none md:inline md:whitespace-normal md:truncate" // marquee 적용, md 이상에선 해제 및 truncate
                  title={activeStation.name}
                >
                  {activeStation.name}
                </h2>
              </div>
              {/* Song Info Area */}
              {/* gap-1 로 약간 줄임 */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {/* Refresh Button 추가 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-5 w-5 p-0 flex-shrink-0 mr-1", // 크기 및 마진 조정
                    !canRefreshSong && "opacity-30 cursor-not-allowed",
                    isLoadingSong && "animate-spin" // 로딩 중 아이콘 회전
                  )}
                  onClick={onRefreshSong}
                  disabled={!canRefreshSong}
                  title="Refresh song info"
                >
                  <RefreshCw className="h-3 w-3" /> {/* 아이콘 크기 조정 */}
                </Button>
                {/* Song Title Wrapper for Marquee */}
                {/* mr-1 추가하여 버튼과 간격 확보 */}
                <div className="overflow-hidden whitespace-nowrap flex-grow min-w-0 h-4 mr-1">
                  {isLoadingSong ? (
                    <span className="flex items-center text-xs h-full">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Loading...
                    </span>
                  ) : currentSong ? (
                    <span
                      title={currentSong}
                      className="animate-marquee md:animate-none md:inline md:whitespace-normal md:truncate"
                    >
                      {currentSong}
                    </span>
                  ) : isSongUnavailable ? (
                    <span className="flex items-center text-xs text-yellow-600 dark:text-yellow-500 h-full">
                      <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" /> Song Info unavailable
                    </span>
                  ) : (
                    <span className="truncate">{activeStation.genre}</span> // 노래 정보 없을 때 장르 표시 (기본값)
                  )}
                </div>
                {/* Save Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-5 w-5 p-0 flex-shrink-0 ml-1", // 마진 조정
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
                {/* Separator & Game Info: 기본 hidden, md 이상에서 inline */}
                <span className="mx-1 flex-shrink-0 hidden md:inline">|</span>
                <span className="flex-shrink-0 hidden md:inline">{activeGame}</span>
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

        {/* 기본 hidden, md 이상에서 flex */}
        <div className="hidden md:flex items-center space-x-2 w-32">
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