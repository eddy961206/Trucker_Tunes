import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioStation, Game } from '@/types'; // types/index.ts 에서 가져오기
import { Star } from 'lucide-react';

// StationList Props 인터페이스 정의
interface StationListProps {
  stations: RadioStation[];
  game: Game | null; // 즐겨찾기 탭 위해 null 허용
  onPlay: (station: RadioStation, game: Game | null) => void; // game이 null일 수 있음을 반영
  onToggleFavorite: (station: RadioStation) => void;
  isFavorite: (station: RadioStation) => boolean;
}

export const StationList: React.FC<StationListProps> = ({ stations, game, onPlay, onToggleFavorite, isFavorite }) => {
  if (stations.length === 0) {
    return <p className="text-muted-foreground p-4 text-center">No stations match your filters.</p>;
  }

  // 즐겨찾기 탭일 때 game을 결정하는 로직은 Home 컴포넌트의 playStation 콜백 내부에서 처리하는 것이 더 적절해 보입니다.
  // 여기서는 전달받은 game 값을 그대로 onPlay에 넘겨줍니다.

  return (
    <ScrollArea className="h-[45vh] md:h-[50vh] w-full rounded-md border">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
        {stations.map((station) => {
          const favorited = isFavorite(station);

          return (
            <div key={station.streamUrl} className="flex items-center bg-card p-3 rounded-md border group">
              <Button
                variant="ghost"
                className="flex-grow h-auto justify-start text-left flex flex-col items-start p-0 mr-2"
                onClick={() => onPlay(station, game)} // Home에서 받은 game(null일 수 있음) 그대로 전달
                title={`Play ${station.name}`}
              >
                <span className="font-semibold truncate w-full">{station.name}</span>
                <span className="text-xs text-muted-foreground">{station.genre}</span>
              </Button>
              {/* 즐겨찾기 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleFavorite(station)}
                title={favorited ? "Remove from favorites" : "Add to favorites"}
                className="flex-shrink-0 text-muted-foreground hover:text-primary"
              >
                <Star
                  className={cn(
                    "h-5 w-5",
                    favorited ? "fill-yellow-400 text-yellow-500" : "fill-none"
                  )}
                />
              </Button>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};