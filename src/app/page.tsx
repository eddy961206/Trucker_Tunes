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
  Loader2,
  Star,
  Bookmark, // 곡 저장 아이콘
  Trash2,   // 삭제 아이콘
  ExternalLink, // 외부 링크 아이콘
  ListMusic, // 저장된 곡 탭 아이콘
} from 'lucide-react';
import {Slider} from '@/components/ui/slider';
// getCurrentSong은 actions 파일에서 가져옵니다.
import {getCurrentSong} from './actions';

// 저장된 곡 타입
interface SavedSong {
  id: number; // 타임스탬프 사용
  title: string;
  artist?: string; // 파싱 성공 시 저장
  stationName: string;
  savedAt: number; // 타임스탬프
  streamUrl: string; // 원본 스트림 URL (중복 저장 방지 등에 사용 가능)
}

interface PlayerProps {
  activeStation: RadioStation | null;
  activeGame: Game | null;
  isPlaying: boolean;
  playStation: (station: RadioStation, game: Game) => void; // playStation 시그니처 유지
  stopStation: () => void;
  handlePrevStation: () => void;
  handleNextStation: () => void;
  handleRandomStation: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  stations: RadioStation[];
  currentSong: string | null; // Home에서 받음
  isLoadingSong: boolean; // Home에서 받음
  isSongUnavailable: boolean; // Home에서 받음
  onSaveSong: () => void; // 저장 버튼 클릭 시 호출될 함수
}

const Player: React.FC<PlayerProps> = ({
  activeStation,
  activeGame,
  isPlaying,
  playStation,
  stopStation,
  handlePrevStation,
  handleNextStation,
  handleRandomStation,
  volume,
  setVolume,
  stations,
  currentSong, // Home에서 전달받음
  isLoadingSong, // Home에서 전달받음
  isSongUnavailable, // Home에서 전달받음
  onSaveSong, // Home에서 전달받음
}) => {
  const volumeIcon = volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />;

  // 버튼 비활성화 로직
  const isControlDisabled = stations.length === 0 || !activeStation;
  const canSaveSong = !isLoadingSong && currentSong && activeStation; // 저장 가능 조건

  return (
    <div className="fixed bottom-0 left-0 w-full bg-secondary/80 backdrop-blur-md border-t border-border z-10 shadow-lg">
      <div className="container mx-auto p-4 flex items-center justify-between gap-4">
        {/* 스테이션 정보 */}
        <div className="flex-shrink min-w-0 max-w-xs md:max-w-sm lg:max-w-md">
          {activeStation ? (
            <div>
              <h2 className="text-lg font-semibold truncate" title={activeStation.name}>{activeStation.name}</h2>
              {/* 노래 정보 및 저장 버튼 컨테이너 */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                 {/* 노래 정보 표시 */}
                 <span className="flex-grow truncate"> {/* 제목 영역이 늘어나도록 */}
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
                    activeStation.genre // 기본 정보 (장르)
                    )}
                </span>

                {/* 곡 저장 버튼 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-5 w-5 p-0 flex-shrink-0", // 크기 및 패딩 조절
                    !canSaveSong && "opacity-50 cursor-not-allowed" // 비활성화 스타일
                  )}
                  onClick={onSaveSong}
                  disabled={!canSaveSong}
                  title={canSaveSong ? "Save this song" : "Cannot save song"}
                >
                  <Bookmark className="h-4 w-4" />
                </Button>

                {/* 게임 정보 */}
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

  // 즐겨찾기 상태
  const [favoritedStations, setFavoritedStations] = useState<RadioStation[]>([]);
  // 저장된 곡 상태 추가
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>([]);
  // 현재 곡 정보 상태 (Player에서 Home으로 이동)
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [isLoadingSong, setIsLoadingSong] = useState(false);
  const [isSongUnavailable, setIsSongUnavailable] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // Interval ID 저장용 Ref

  // 로컬 저장소에서 즐겨찾기 불러오기 (컴포넌트 마운트 시)
  useEffect(() => {
    const storedFavorites = localStorage.getItem('favoriteStations');
    if (storedFavorites) {
      try {
        setFavoritedStations(JSON.parse(storedFavorites));
      } catch (error) {
        console.error("Failed to parse favorites from localStorage:", error);
        localStorage.removeItem('favoriteStations'); // 파싱 실패 시 제거
      }
    }
  }, []);

  // 즐겨찾기 상태 변경 시 로컬 저장소에 저장
  useEffect(() => {
    // 초기 로드 시 빈 배열 저장을 방지하기 위해 조건 추가 가능 (선택 사항)
    // if (favoritedStations.length > 0 || localStorage.getItem('favoriteStations')) {
       localStorage.setItem('favoriteStations', JSON.stringify(favoritedStations));
    // }
  }, [favoritedStations]);

  // 로컬 저장소 - 저장된 곡 불러오기/저장하기 (새로 추가)
  useEffect(() => {
    const storedSavedSongs = localStorage.getItem('savedSongs');
    if (storedSavedSongs) {
      try {
        setSavedSongs(JSON.parse(storedSavedSongs));
      } catch (error) {
        console.error("Failed to parse saved songs from localStorage:", error);
        localStorage.removeItem('savedSongs');
      }
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('savedSongs', JSON.stringify(savedSongs));
  }, [savedSongs]);
  

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

  // --- 현재 곡 정보 가져오기 로직 (수정됨) ---
  // 곡 정보를 가져오고 상태를 업데이트하는 함수 (useCallback으로 감싸기)
  const fetchAndUpdateSong = useCallback(async (station: RadioStation | null) => {
    if (!station || !station.streamUrl) {
      setCurrentSong(null);
      setIsLoadingSong(false);
      setIsSongUnavailable(false);
      return;
    }

    // 첫 호출 시 또는 스테이션 변경 시 로딩 상태 표시
    // 주기적 호출 시에는 백그라운드에서 업데이트하므로 로딩 표시 안 함 (선택적)
    // 여기서는 일단 로딩 표시는 초기 호출 시에만 하도록 로직 분리 필요
    // 우선 간단하게 로딩 표시는 제거하고 진행

    try {
      // 서버 액션 호출
      const song = await getCurrentSong(station.streamUrl);
      // 상태 업데이트 (현재 곡 정보와 다를 경우에만 업데이트하여 불필요한 리렌더링 방지)
      setCurrentSong(prevSong => {
        if (song !== prevSong) {
            setIsSongUnavailable(!song); // song이 null이면 true
            return song; // 새로운 곡 정보 반환
        }
        return prevSong; // 변경 없으면 이전 상태 유지
      });
    } catch (error) {
      console.error("Error fetching song periodically:", error);
      // 에러 발생 시 정보 없음 처리 (이전 정보와 다를 경우만 업데이트)
      setCurrentSong(prevSong => {
        if (prevSong !== null) {
            setIsSongUnavailable(true);
            return null;
        }
        return prevSong;
      });
    } finally {
        // 주기적 호출에서는 로딩 상태를 계속 true로 두지 않음
        setIsLoadingSong(false);
    }
  }, []); // 의존성 배열 비움 (내부에서 최신 상태 참조 안 하므로) - 필요 시 currentSong 추가 고려

  // 스테이션 변경 또는 재생 상태 변경 시 곡 정보 가져오기 및 인터벌 설정/해제
  useEffect(() => {
    // 기존 인터벌 클리어
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPlaying && activeStation) {
      // 재생 시작 시 즉시 한 번 호출 (로딩 상태 포함)
      setIsLoadingSong(true);
      setIsSongUnavailable(false);
      setCurrentSong(null); // 초기화
      fetchAndUpdateSong(activeStation); // 즉시 호출

      // 20초 간격으로 업데이트 설정
      intervalRef.current = setInterval(() => {
        fetchAndUpdateSong(activeStation);
      }, 20000); // 20초 (20000ms)

    } else {
      // 재생 중이 아니거나 스테이션이 없으면 상태 초기화
      setCurrentSong(null);
      setIsLoadingSong(false);
      setIsSongUnavailable(false);
    }

    // 클린업 함수: 컴포넌트 언마운트 또는 의존성 변경 시 인터벌 해제
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // isPlaying, activeStation 변경 시 인터벌 재설정
    // fetchAndUpdateSong 함수 자체는 useCallback으로 감쌌으므로 참조 안정적
  }, [isPlaying, activeStation, fetchAndUpdateSong]);

  // 즐겨찾기 토글 함수
  const toggleFavorite = useCallback((stationToToggle: RadioStation) => {
    setFavoritedStations((prevFavorites) => {
      const isFavorited = prevFavorites.some(
        (favStation) => favStation.streamUrl === stationToToggle.streamUrl
      );
      if (isFavorited) {
        // 즐겨찾기에서 제거
        toast.info(`${stationToToggle.name} removed from favorites`);
        return prevFavorites.filter(
          (favStation) => favStation.streamUrl !== stationToToggle.streamUrl
        );
      } else {
        // 즐겨찾기에 추가
        toast.success(`${stationToToggle.name} added to favorites`);
        return [...prevFavorites, stationToToggle];
      }
    });
  }, []); // 의존성 없음

  // isFavorite 함수 (StationList에 전달하여 버튼 상태 결정)
   const isFavorite = useCallback((station: RadioStation): boolean => {
    return favoritedStations.some(fav => fav.streamUrl === station.streamUrl);
  }, [favoritedStations]);

  // --- 곡 저장 및 삭제 로직 ---
  const handleSaveSong = useCallback(() => {
    if (!currentSong || !activeStation) {
      toast.error("Cannot save song", { description: "No song information available." });
      return;
    }

    // 아티스트 - 제목 형식 시도 (예: "Artist Name - Song Title")
    const parts = currentSong.split(' - ');
    let title = currentSong;
    let artist: string | undefined;
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }

    const newSavedSong: SavedSong = {
      id: Date.now(), // 간단하게 타임스탬프를 ID로 사용
      title: title,
      artist: artist,
      stationName: activeStation.name,
      savedAt: Date.now(),
      streamUrl: activeStation.streamUrl,
    };

    // 간단한 중복 방지 (같은 곡 제목, 같은 스테이션에서 방금 저장했는지 확인 - 1분 이내)
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const alreadyExists = savedSongs.some(song =>
        song.title === newSavedSong.title &&
        song.artist === newSavedSong.artist && // 아티스트도 비교
        song.stationName === newSavedSong.stationName &&
        song.savedAt > oneMinuteAgo
    );

    if (alreadyExists) {
        toast.info("Song already saved recently", { description: `${newSavedSong.title} from ${newSavedSong.stationName}` });
    } else {
        setSavedSongs((prev) => [newSavedSong, ...prev]); // 최신 곡을 맨 위에 추가
        toast.success("Song saved!", { description: `${newSavedSong.title}` });
    }

  }, [currentSong, activeStation, savedSongs]); // 의존성 배열 업데이트

  const handleDeleteSong = useCallback((idToDelete: number) => {
    setSavedSongs((prev) => prev.filter((song) => song.id !== idToDelete));
    toast.info("Saved song removed.");
  }, []);
  // --- ---  

  // 재생 함수 (useCallback) - 수정: playStation 시그니처 변경 대응
  const playStation = useCallback(
    (station: RadioStation, game: Game | null) => { // game이 null일 수 있음
      const actualGame = game ?? (ets2Stations.some(s => s.streamUrl === station.streamUrl) ? 'ETS2' : 'ATS');
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
    // playStation 의존성 배열 확인 필요
    [volume, ets2Stations] // ets2Stations 추가 (game 판별용)
    // stopStation 제거 시 에러났던 부분 해결되었는지 확인 필요 -> playStation 자체에서 stopStation 호출은 괜찮음
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
  // 즐겨찾기 목록 필터링 (검색어만 적용)
  const filteredFavoritedStations = useMemo(() => {
      return favoritedStations.filter(station =>
          station.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [favoritedStations, searchQuery]);
  // 저장된 곡 필터링 (제목, 아티스트, 스테이션 이름 기준)
  const filteredSavedSongs = useMemo(() => {
    if (!searchQuery) return savedSongs;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return savedSongs.filter(song =>
        song.title.toLowerCase().includes(lowerCaseQuery) ||
        (song.artist && song.artist.toLowerCase().includes(lowerCaseQuery)) ||
        song.stationName.toLowerCase().includes(lowerCaseQuery)
    );
  }, [savedSongs, searchQuery]);

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

      {/* 게임 및 즐겨찾기 탭 */}
      {/* 게임 탭 */}
      <Tabs defaultValue="ets2" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ets2">Euro Truck Simulator 2 ({filteredEts2Stations.length})</TabsTrigger>
          <TabsTrigger value="ats">American Truck Simulator ({filteredAtsStations.length})</TabsTrigger>{/* Favorites 탭 추가 */}
          <TabsTrigger value="favorites">
            <Star className="w-4 h-4 mr-1" /> {/* 별 아이콘 추가 */}
            Favorites ({filteredFavoritedStations.length})
          </TabsTrigger>
           {/* Saved Songs 탭 추가 */}
           <TabsTrigger value="savedSongs">
            <ListMusic className="w-4 h-4 mr-1" /> {/* 아이콘 변경 */}
            Saved ({filteredSavedSongs.length})
          </TabsTrigger>
        </TabsList>

        {/* ETS2 스테이션 목록 */}
        <TabsContent value="ets2">
          <StationList
            stations={filteredEts2Stations}
            game="ETS2"
            onPlay={playStation}
            onToggleFavorite={toggleFavorite} // 토글 함수 전달
            isFavorite={isFavorite} // 즐겨찾기 여부 확인 함수 전달
          />
        </TabsContent>

        {/* ATS 스테이션 목록 */}
        <TabsContent value="ats">
           <StationList
             stations={filteredAtsStations}
             game="ATS"
             onPlay={playStation}
             onToggleFavorite={toggleFavorite} // 토글 함수 전달
             isFavorite={isFavorite} // 즐겨찾기 여부 확인 함수 전달
            />
        </TabsContent>

        {/* Favorites 스테이션 목록 */}
        <TabsContent value="favorites">
           <StationList
             stations={filteredFavoritedStations}
             game={null} // Favorites에서는 game 판별 필요 -> StationList 내부 또는 playStation 호출 시
             onPlay={playStation} // playStation 호출 시 game 판별
             onToggleFavorite={toggleFavorite}
             isFavorite={isFavorite}
            />
        </TabsContent>

         {/* Saved Songs 목록 */}
        <TabsContent value="savedSongs">
           <SavedSongsList
                songs={filteredSavedSongs}
                onDeleteSong={handleDeleteSong}
            />
        </TabsContent>
      </Tabs>

      
      {/* 하단 플레이어: 현재 곡 관련 상태 및 저장 핸들러 전달 */}
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
        stations={allStations}
        currentSong={currentSong} // 전달
        isLoadingSong={isLoadingSong} // 전달
        isSongUnavailable={isSongUnavailable} // 전달
        onSaveSong={handleSaveSong} // 전달
      />
    </div>
  );
}

// StationList 컴포넌트 수정: onPlay 호출 시 game 타입 변경 대응
interface StationListProps {
  stations: RadioStation[];
  game: Game | null;
  onPlay: (station: RadioStation, game: Game | null) => void; // game: Game | null
  onToggleFavorite: (station: RadioStation) => void;
  isFavorite: (station: RadioStation) => boolean;
}

const StationList: React.FC<StationListProps> = ({ stations, game, onPlay, onToggleFavorite, isFavorite }) => {
  if (stations.length === 0) {
    return <p className="text-muted-foreground p-4 text-center">No stations match your filters.</p>;
  }

  // 즐겨찾기 탭일 경우 game 결정 로직 (선택적 개선)
  const determineGame = (station: RadioStation): Game => {
      // 실제로는 ets2/ats 스테이션 목록을 Home에서 받아서 확인해야 더 정확함
      // 여기서는 간단히 'ETS2' 또는 'ATS' 중 하나로 가정하거나,
      // station 객체에 game 정보가 있다면 그것을 사용
      return game || 'ETS2'; // 기본값 또는 적절한 로직 필요
  }

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
                className="flex-shrink-0 text-muted-foreground hover:text-primary" // 기본 색상 및 호버 효과
              >
                <Star
                  className={cn(
                    "h-5 w-5",
                    favorited ? "fill-yellow-400 text-yellow-500" : "fill-none" // 즐겨찾기 시 채움
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

// --- SavedSongsList 컴포넌트 (새로 추가) ---
interface SavedSongsListProps {
  songs: SavedSong[];
  onDeleteSong: (id: number) => void;
}

const SavedSongsList: React.FC<SavedSongsListProps> = ({ songs, onDeleteSong }) => {
  if (songs.length === 0) {
      return <p className="text-muted-foreground p-4 text-center">No saved songs yet. Use the bookmark icon in the player to save songs you like!</p>;
  }

  // 날짜 포맷 함수 (옵션)
  const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
  };

  // 외부 검색 링크 생성 함수
  const getSearchUrl = (song: SavedSong): string => {
      const query = encodeURIComponent(`${song.artist || ''} ${song.title}`);
      // YouTube Music 검색 URL 예시
      return `https://music.youtube.com/search?q=${query}`;
  };

  return (
      <ScrollArea className="h-[60vh] md:h-[65vh] w-full rounded-md border"> {/* 높이 조정 */}
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
                          title="Search on YouTube Music"
                          className={cn(
                              buttonVariants({ variant: "ghost", size: "icon" }),
                              "flex-shrink-0 h-8 w-8" // 크기 조절
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
                          className="flex-shrink-0 text-red-500 hover:text-red-700 h-8 w-8" // 크기 조절 및 색상
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
              ))}
          </div>
      </ScrollArea>
  );
};

// shadcn buttonVariants import 필요 (만약 buttonVariants 사용 시)
import { buttonVariants } from "@/components/ui/button";