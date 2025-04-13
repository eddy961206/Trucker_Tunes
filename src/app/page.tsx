'use client';

import {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {RadioStation, getRadioStations, Game} from '@/services/radio-parser';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ScrollArea, ScrollBar} from '@/components/ui/scroll-area';
// useToast 훅 대신 sonner의 toast 사용 (만약 설치했다면)
// import { useToast } from "@/hooks/use-toast";
import {toast} from 'sonner'; // sonner 사용 예시
import {cn} from '@/lib/utils';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Volume2,
  VolumeX,
  AlertTriangle,
  Loader2, // 로딩 아이콘 추가
} from 'lucide-react';
import {Slider} from '@/components/ui/slider';
// getCurrentSong은 actions 파일에서 가져옵니다.
import {getCurrentSong} from './actions';

interface PlayerProps {
  activeStation: RadioStation | null;
  activeGame: Game | null;
  isPlaying: boolean;
  playStation: (station: RadioStation, game: Game) => void;
  stopStation: () => void;
  handlePrevStation: () => void;
  handleNextStation: () => void;
  handleRandomStation: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  stations: RadioStation[]; // 전체 스테이션 목록 추가 (이전/다음 버튼 활성화용)
}

const Player: React.FC<PlayerProps> = ({
  activeStation,
  activeGame,
  isPlaying,
  playStation, // playStation 함수 받기
  stopStation, // stopStation 함수 받기
  handlePrevStation, // 이전 버튼 핸들러
  handleNextStation, // 다음 버튼 핸들러
  handleRandomStation, // 랜덤 버튼 핸들러
  volume,
  setVolume,
  stations, // 전체 스테이션 목록 받기
}) => {
  const volumeIcon = volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />;
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [isLoadingSong, setIsLoadingSong] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false); // 정보 없음 상태 추가

  // activeStation이 변경될 때마다 노래 정보를 가져옵니다.
  useEffect(() => {
    let isMounted = true; // 컴포넌트 마운트 상태 추적

    const fetchSong = async () => {
      if (activeStation && activeStation.streamUrl) {
        setIsLoadingSong(true);
        setIsUnavailable(false); // 초기화
        setCurrentSong(null); // 이전 정보 클리어
        try {
          // actions.ts의 getCurrentSong 호출
          const song = await getCurrentSong(activeStation.streamUrl);
          if (isMounted) {
            if (song) {
              setCurrentSong(song);
              setIsUnavailable(false);
            } else {
              setCurrentSong(null);
              setIsUnavailable(true); // 정보 없음 상태 설정
            }
          }
        } catch (error) {
          console.error("Error fetching song from Server Action:", error);
          if (isMounted) {
            setCurrentSong(null);
            setIsUnavailable(true); // 에러 발생 시에도 정보 없음으로 간주
          }
        } finally {
          if (isMounted) {
            setIsLoadingSong(false);
          }
        }
      } else {
        // activeStation이 없으면 상태 초기화
        setCurrentSong(null);
        setIsLoadingSong(false);
        setIsUnavailable(false);
      }
    };

    fetchSong();

    // 컴포넌트 언마운트 시 비동기 작업 취소 (메모리 누수 방지)
    return () => {
      isMounted = false;
    };
  }, [activeStation]); // activeStation이 바뀔 때만 실행

  // 버튼 비활성화 로직 수정
  const isControlDisabled = stations.length === 0 || !activeStation;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-secondary/80 backdrop-blur-md border-t border-border z-10 shadow-lg">
      <div className="container mx-auto p-4 flex items-center justify-between gap-4">
        {/* 스테이션 정보 */}
        <div className="flex-shrink min-w-0 max-w-xs md:max-w-sm lg:max-w-md">
          {activeStation ? (
            <div>
              <h2 className="text-lg font-semibold truncate" title={activeStation.name}>{activeStation.name}</h2>
              <div className="text-sm text-muted-foreground truncate">
                {/* 노래 정보 표시 */}
                {isLoadingSong ? (
                  <span className="flex items-center text-xs">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Loading song...
                  </span>
                ) : currentSong ? (
                  <span title={currentSong}>{currentSong}</span>
                ) : isUnavailable ? (
                  <span className="flex items-center text-xs text-yellow-600 dark:text-yellow-500">
                    <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                    Song info not available
                  </span>
                ) : (
                  // 로딩도 아니고, 노래 정보도 없고, unavailable 상태도 아니면 장르 표시 (초기 상태 등)
                  activeStation.genre
                )}
                <span className="mx-1">|</span>
                <span>{activeGame}</span>
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
            disabled={!activeStation} // 재생/정지 버튼은 스테이션 선택 시에만 활성화
            className="w-10 h-10" // 버튼 크기 조정
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

export default function Home() {
  const [ets2Stations, setEts2Stations] = useState<RadioStation[]>([]);
  const [atsStations, setAtsStations] = useState<RadioStation[]>([]);
  const [activeStation, setActiveStation] = useState<RadioStation | null>(null);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // audio 상태 제거, audioRef만 사용
  // const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(50); // 기본 볼륨 50
  // useToast() 대신 sonner 사용 시 제거
  // const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // useRouter 제거 (사용 안 함)
  // const router = useRouter();

  // .sii 파일 로딩
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const [ets2Response, atsResponse] = await Promise.all([
          fetch('/data/ETS2_live_streams.sii'),
          fetch('/data/ATS_live_streams.sii'),
        ]);

        if (!ets2Response.ok) throw new Error(`Failed ETS2: ${ets2Response.statusText}`);
        if (!atsResponse.ok) throw new Error(`Failed ATS: ${atsResponse.statusText}`);

        const [ets2FileContent, atsFileContent] = await Promise.all([
          ets2Response.text(),
          atsResponse.text(),
        ]);

        const [ets2Data, atsData] = await Promise.all([
          getRadioStations('ETS2', ets2FileContent),
          getRadioStations('ATS', atsFileContent),
        ]);

        setEts2Stations(ets2Data);
        setAtsStations(atsData);
      } catch (error) {
        console.error('Error fetching or parsing station data:', error);
        // sonner 사용 시
        toast.error('Error loading stations', {
          description: 'Could not load radio station data. Please check the console.',
        });
        // 기존 useToast 사용 시
        /*
        toast({
          title: 'Error loading stations',
          description: 'Could not load radio station data. Please check the console.',
          variant: 'destructive',
        });
        */
      }
    };

    fetchStations();
  }, []); // 마운트 시 한 번만 실행

  // 볼륨 조절
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // 재생 함수 (useCallback으로 최적화)
  const playStation = useCallback(
    (station: RadioStation, game: Game) => {
      // 현재 재생 중인 오디오 중지 및 리소스 정리
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src'); // 이전 소스 제거
        audioRef.current.load(); // 리소스 로드 중단 시도
        audioRef.current = null; // 참조 제거
      }

      // 새 오디오 요소 생성 및 설정
      const newAudio = new Audio(station.streamUrl);
      audioRef.current = newAudio;
      newAudio.volume = volume / 100;

      // 스트림 에러 처리
      const audioErrorListener = (event: Event) => {
        console.error('Audio stream error:', event);
        const error = (event.target as HTMLAudioElement).error;
        let errorMessage = `Failed to play ${station.name}. `;
        if (error) {
           errorMessage += `Code: ${error.code}, Message: ${error.message}`;
        } else {
           errorMessage += 'Unknown stream error.';
        }
        toast.error('Stream Error', { description: errorMessage });
        stopStation(); // 플레이어 정지
        newAudio.removeEventListener('error', audioErrorListener); // 리스너 제거
      };
      newAudio.addEventListener('error', audioErrorListener);

      // 재생 시도
      newAudio.play()
        .then(() => {
          setIsPlaying(true);
          setActiveStation(station);
          setActiveGame(game);
          toast.success('Playing Station', {
            description: `Now playing: ${station.name}`,
          });
        })
        .catch((playError) => {
          console.error('Failed to play audio:', playError);
          toast.error('Playback Error', {
            description: `Failed to start playback for ${station.name}. Check console.`,
          });
          newAudio.removeEventListener('error', audioErrorListener);
          stopStation(); // 클로저를 통해 접근 가능
        });
    },
    // [volume, stopStation] 에서 stopStation 제거
    [volume] // 이제 volume만 의존성으로 가집니다.
  );


  // 정지 함수 (useCallback으로 최적화)
  const stopStation = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src'); // 소스 제거
      audioRef.current.load(); // 리소스 로드 중단
      // audioRef.current = null; // playStation에서 관리하므로 여기선 null로 안 만듦
      setIsPlaying(false);
      setActiveStation(null);
      setActiveGame(null);
      console.log('Audio stopped and resources potentially released.');
    }
  }, []);


  // 전체 스테이션 목록
  const allStations = useMemo(() => [...ets2Stations, ...atsStations], [ets2Stations, atsStations]);

  // 이전 곡 (현재 게임 탭 기준, 없으면 전체 목록 기준)
  const handlePrevStation = useCallback(() => {
    if (!activeStation || allStations.length === 0) return;

    const currentStations = activeGame === 'ETS2' ? ets2Stations : atsStations;
    let currentIndex = currentStations.findIndex((s) => s.streamUrl === activeStation.streamUrl);

    // 현재 탭 목록에 없으면 전체 목록에서 찾기
    if (currentIndex === -1) {
        currentIndex = allStations.findIndex((s) => s.streamUrl === activeStation.streamUrl);
        if (currentIndex === -1) return; // 그래도 없으면 동작 불가

        const prevIndex = (currentIndex - 1 + allStations.length) % allStations.length;
        const prevStation = allStations[prevIndex];
        const game = ets2Stations.some(s => s.streamUrl === prevStation.streamUrl) ? 'ETS2' : 'ATS';
        playStation(prevStation, game);
    } else {
        const prevIndex = (currentIndex - 1 + currentStations.length) % currentStations.length;
        playStation(currentStations[prevIndex], activeGame!);
    }

  }, [activeStation, activeGame, ets2Stations, atsStations, allStations, playStation]);

  // 다음 곡 (현재 게임 탭 기준, 없으면 전체 목록 기준)
  const handleNextStation = useCallback(() => {
     if (!activeStation || allStations.length === 0) return;

    const currentStations = activeGame === 'ETS2' ? ets2Stations : atsStations;
    let currentIndex = currentStations.findIndex((s) => s.streamUrl === activeStation.streamUrl);

    // 현재 탭 목록에 없으면 전체 목록에서 찾기
    if (currentIndex === -1) {
        currentIndex = allStations.findIndex((s) => s.streamUrl === activeStation.streamUrl);
         if (currentIndex === -1) return; // 그래도 없으면 동작 불가

        const nextIndex = (currentIndex + 1) % allStations.length;
        const nextStation = allStations[nextIndex];
        const game = ets2Stations.some(s => s.streamUrl === nextStation.streamUrl) ? 'ETS2' : 'ATS';
        playStation(nextStation, game);
    } else {
        const nextIndex = (currentIndex + 1) % currentStations.length;
        playStation(currentStations[nextIndex], activeGame!);
    }
  }, [activeStation, activeGame, ets2Stations, atsStations, allStations, playStation]);

  // 랜덤 곡
  const handleRandomStation = useCallback(() => {
    if (allStations.length > 0) {
      const randomIndex = Math.floor(Math.random() * allStations.length);
      const randomStation = allStations[randomIndex];
      // 랜덤 스테이션이 어느 게임 목록에 있는지 확인
      const game = ets2Stations.some(s => s.streamUrl === randomStation.streamUrl) ? 'ETS2' : 'ATS';
      playStation(randomStation, game);
    } else {
      toast.info("No stations available", { description: "Cannot play random station." });
    }
  }, [allStations, ets2Stations, playStation]); // playStation 의존성 추가


  // 장르 필터링
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const genres = useMemo(() => [...new Set(allStations.map((station) => station.genre).filter(Boolean))].sort(), [allStations]);

  const filterStations = useCallback((stations: RadioStation[]) => {
    return stations.filter((station) => {
      const searchMatch = station.name.toLowerCase().includes(searchQuery.toLowerCase());
      const genreMatch = selectedGenre ? station.genre === selectedGenre : true;
      return searchMatch && genreMatch;
    });
  }, [searchQuery, selectedGenre]);

  const filteredEts2Stations = useMemo(() => filterStations(ets2Stations), [ets2Stations, filterStations]);
  const filteredAtsStations = useMemo(() => filterStations(atsStations), [atsStations, filterStations]);

  // 메인 UI 렌더링
  return (
    // pt-4 pb-24 추가 (하단 플레이어 높이만큼 패딩 확보)
    <div className="container mx-auto pt-4 pb-24 px-4">
      <h1 className="text-2xl font-bold mb-4">Trucker Tunes</h1>

      {/* 검색 및 랜덤 버튼 */}
      <div className="mb-4 flex flex-col sm:flex-row items-center gap-4">
        <Input
          type="text"
          placeholder="Search stations by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleRandomStation} variant="outline" disabled={allStations.length === 0} className="w-full sm:w-auto">
          <Shuffle className="mr-2 h-4 w-4" />
          Random Station
        </Button>
      </div>

      {/* 장르 필터 */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Filter by Genre:</p>
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="flex space-x-2">
            <Button
              size="sm" // 작은 버튼
              variant={!selectedGenre ? 'secondary' : 'ghost'} // 선택 시 강조
              onClick={() => setSelectedGenre(null)}
              className={cn("rounded-full", !selectedGenre && "border border-primary")} // 테두리 추가
            >
              All Genres
            </Button>
            {genres.map((genre) => (
              <Button
                size="sm"
                key={genre}
                variant={selectedGenre === genre ? 'secondary' : 'ghost'}
                onClick={() => setSelectedGenre(genre)}
                className={cn("rounded-full", selectedGenre === genre && "border border-primary")}
              >
                {genre}
              </Button>
            ))}
          </div>
           <ScrollBar orientation="horizontal" /> {/* 스크롤바 추가 */}
        </ScrollArea>
      </div>

      {/* 게임 탭 */}
      <Tabs defaultValue="ets2" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ets2">Euro Truck Simulator 2 ({filteredEts2Stations.length})</TabsTrigger>
          <TabsTrigger value="ats">American Truck Simulator ({filteredAtsStations.length})</TabsTrigger>
        </TabsList>

        {/* ETS2 스테이션 목록 */}
        <TabsContent value="ets2">
          <StationList stations={filteredEts2Stations} game="ETS2" onPlay={playStation} />
        </TabsContent>

        {/* ATS 스테이션 목록 */}
        <TabsContent value="ats">
           <StationList stations={filteredAtsStations} game="ATS" onPlay={playStation} />
        </TabsContent>
      </Tabs>

      {/* 하단 플레이어 */}
      <Player
        activeStation={activeStation}
        activeGame={activeGame}
        isPlaying={isPlaying}
        playStation={playStation}
        stopStation={stopStation}
        handlePrevStation={handlePrevStation}
        handleNextStation={handleNextStation}
        handleRandomStation={handleRandomStation}
        volume={volume}
        setVolume={setVolume}
        stations={allStations} // 전체 스테이션 목록 전달
      />
    </div>
  );
}

// 스테이션 목록 컴포넌트 분리 (가독성 향상)
interface StationListProps {
  stations: RadioStation[];
  game: Game;
  onPlay: (station: RadioStation, game: Game) => void;
}

const StationList: React.FC<StationListProps> = ({ stations, game, onPlay }) => {
  if (stations.length === 0) {
    return <p className="text-muted-foreground p-4 text-center">No stations match your filters.</p>;
  }

  return (
    <ScrollArea className="h-[45vh] md:h-[50vh] w-full rounded-md border"> {/* 높이 조정 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4"> {/* 반응형 그리드 개선 */}
        {stations.map((station) => (
          <Button
            variant="outline" // outline 스타일
            className="w-full h-auto justify-start text-left flex flex-col items-start p-3" // 스타일 변경
            key={station.streamUrl}
            onClick={() => onPlay(station, game)}
            title={`Play ${station.name}`}
          >
            <span className="font-semibold truncate w-full">{station.name}</span>
            <span className="text-xs text-muted-foreground">{station.genre}</span>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};