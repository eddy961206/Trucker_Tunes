import React from 'react';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button'; // buttonVariants 추가
import { ScrollArea } from '@/components/ui/scroll-area';
import { SavedSong } from '@/types'; // types/index.ts 에서 가져오기
import { Trash2, ExternalLink } from 'lucide-react';

// SavedSongsList Props 인터페이스 정의
interface SavedSongsListProps {
  songs: SavedSong[];
  onDeleteSong: (id: number) => void;
}

// 날짜 포맷 함수 (컴포넌트 외부에 두거나 유틸리티 함수로 분리 가능)
const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

// 외부 검색 링크 생성 함수 (컴포넌트 외부에 두거나 유틸리티 함수로 분리 가능)
const getSearchUrl = (song: SavedSong): string => {
    const query = encodeURIComponent(`${song.artist || ''} ${song.title}`);
    // YouTube Music 검색 URL 예시 (YouTube 일반 검색으로 변경 가능)
    // return `https://music.youtube.com/search?q=${query}`;
     return `https://www.youtube.com/results?search_query=${query}`;
};


export const SavedSongsList: React.FC<SavedSongsListProps> = ({ songs, onDeleteSong }) => {
  if (songs.length === 0) {
      return <p className="text-muted-foreground p-4 text-center">No saved songs yet. Use the bookmark icon in the player to save songs you like!</p>;
  }

  return (
      <ScrollArea className="h-[60vh] md:h-[65vh] w-full rounded-md border">
          <div className="p-4 space-y-3">
              {songs.map((song) => (
                  <div key={song.id} className="flex items-center gap-3 bg-card p-3 rounded-md border">
                      <div className="flex-grow min-w-0">
                          <p className="font-semibold truncate" title={song.artist ? `${song.artist} - ${song.title}` : song.title}>
                              {song.artist && <span className="font-normal text-muted-foreground">{song.artist} - </span>}
                              {song.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                              Saved from <span className="font-medium">{song.stationName}</span> on {formatDate(song.savedAt)}
                          </p>
                      </div>
                       {/* 외부 검색 링크 버튼 */}
                      <a
                          href={getSearchUrl(song)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Search on YouTube" // 툴팁 변경
                          className={cn(
                              buttonVariants({ variant: "ghost", size: "icon" }),
                              "flex-shrink-0 h-8 w-8"
                          )}
                      >
                          <ExternalLink className="h-4 w-4" />
                      </a>
                       {/* 삭제 버튼 */}
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteSong(song.id)}
                          title="Remove this saved song"
                          className="flex-shrink-0 text-red-500 hover:text-red-700 h-8 w-8"
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
              ))}
          </div>
      </ScrollArea>
  );
};