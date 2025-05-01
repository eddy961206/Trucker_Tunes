'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// 서비스 및 타입 import
import { getRadioStations } from '@/services/radio-parser';
import { RadioStation, Game, SavedSong } from '@/types'; // types/index.ts 에서 가져오기
import { getCurrentSong } from './actions';
// UI 컴포넌트 import
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button, buttonVariants } from '@/components/ui/button'; // buttonVariants 포함
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
// 분리된 커스텀 컴포넌트 import
import { Player } from '@/components/Player';
import { StationList } from '@/components/StationList';
import { SavedSongsList } from '@/components/SavedSongsList';
// 유틸리티 및 아이콘 import
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Star,
  ListMusic,
  Shuffle,
  // Player 컴포넌트로 이동된 아이콘은 여기서 제거해도 됨 (선택적)
  // Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, AlertTriangle, Loader2, Bookmark
  RefreshCw
} from 'lucide-react'; // 필요한 아이콘만 남기거나 Player 등에서 가져오도록 수정 가능

// HTTP 스트림을 HTTPS로 자동 변환 (가능한 경우)
function getSafeStreamUrl(url: string) {
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}

export default function Home() {
  // --- 상태 관리 ---
  const [ets2Stations, setEts2Stations] = useState<RadioStation[]>([]);
  const [atsStations, setAtsStations] = useState<RadioStation[]>([]);
  const [activeStation, setActiveStation] = useState<RadioStation | null>(null);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnectingStation, setIsConnectingStation] = useState(false); // 이 줄이 있는지 확인!
  const [searchQuery, setSearchQuery] = useState('');
  const [volume, setVolume] = useState(50);
  const [favoritedStations, setFavoritedStations] = useState<RadioStation[]>([]);
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>([]);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [isLoadingSong, setIsLoadingSong] = useState(false);
  const [isSongUnavailable, setIsSongUnavailable] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ets2'); // 현재 활성화된 탭 상태 추가
  const visibilityIntervalRef = useRef<NodeJS.Timeout | null>(null); // 1분 인터벌용 Ref

  // Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- 데이터 로딩 및 동기화 (useEffect) ---
  // 즐겨찾기 로드/저장
  useEffect(() => {
    const storedFavorites = localStorage.getItem('favoriteStations');
    if (storedFavorites) try { setFavoritedStations(JSON.parse(storedFavorites)); } catch { localStorage.removeItem('favoriteStations'); }
  }, []);
  useEffect(() => { localStorage.setItem('favoriteStations', JSON.stringify(favoritedStations)); }, [favoritedStations]);

  // 저장된 곡 로드/저장
  useEffect(() => {
    const storedSavedSongs = localStorage.getItem('savedSongs');
    if (storedSavedSongs) try { setSavedSongs(JSON.parse(storedSavedSongs)); } catch { localStorage.removeItem('savedSongs'); }
  }, []);
  useEffect(() => { localStorage.setItem('savedSongs', JSON.stringify(savedSongs)); }, [savedSongs]);

  // .sii 파일 로딩
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const [ets2Response, atsResponse] = await Promise.all([
          fetch('/data/ETS2_live_streams.sii'), fetch('/data/ATS_live_streams.sii'),
        ]);
        if (!ets2Response.ok || !atsResponse.ok) throw new Error('Failed to fetch station files');
        const [ets2FileContent, atsFileContent] = await Promise.all([ets2Response.text(), atsResponse.text()]);
        const [ets2Data, atsData] = await Promise.all([
          getRadioStations('ETS2', ets2FileContent), getRadioStations('ATS', atsFileContent),
        ]);
        setEts2Stations(ets2Data); setAtsStations(atsData);
      } catch (error) {
        console.error('Error loading station data:', error);
        toast.error('Error loading stations', { description: 'Could not load radio station data.' });
      }
    };
    fetchStations();
  }, []);

  // 볼륨 조절
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [volume]);

  // --- 현재 곡 정보 업데이트 함수 수정 ---
  const fetchAndUpdateSong = useCallback(async (station: RadioStation | null) => {
    if (!station?.streamUrl) {
        setCurrentSong(null); setIsLoadingSong(false); setIsSongUnavailable(false); return false;
    }
    // 수동/자동 새로고침 시에도 로딩 상태 표시
    setIsLoadingSong(true);
    try {
        const song = await getCurrentSong(station.streamUrl);
        if (!song) {
            setCurrentSong(null); setIsSongUnavailable(true); return false;
        }
        // 노래 정보가 실제로 변경되었을 때만 상태 업데이트 및 토스트 표시
        if (song !== currentSong) {
            setCurrentSong(song);
            setIsSongUnavailable(false);
            toast.success("Song info updated", { description: song }); // 성공 토스트 추가
        }
        return true;
    } catch (error) {
        console.error("Error fetching song:", error);
        setCurrentSong(null); setIsSongUnavailable(true); return false;
    } finally {
        setIsLoadingSong(false);
    }
  // currentSong을 의존성에 추가하여 최신 노래 정보와 비교하도록 함
  }, [currentSong]);

  // --- visibilitychange 핸들러 콜백화 ---
  const handleVisibilityChange = useCallback(() => {
    // 콘솔 로그를 추가하여 이벤트 발생 확인
    console.log(`Visibility changed. document.hidden: ${document.hidden}`);

    if (document.hidden) {
      // 탭 숨겨지면 인터벌 클리어
      if (visibilityIntervalRef.current) {
        clearInterval(visibilityIntervalRef.current);
        visibilityIntervalRef.current = null;
        console.log("Tab hidden, stopping auto-refresh.");
      }
    } else {
      // 탭 다시 보이면 즉시 업데이트 시도 (재생 중일 때만)
      console.log("Tab visible.");
      // isPlaying과 activeStation의 최신 상태를 직접 참조
      if (isPlaying && activeStation) {
        console.log("Fetching song info immediately because tab became visible.");
        fetchAndUpdateSong(activeStation); // 즉시 실행

        // 기존 인터벌 제거 후 새로 시작 (1분 간격)
        if (visibilityIntervalRef.current) {
             clearInterval(visibilityIntervalRef.current);
        }
        visibilityIntervalRef.current = setInterval(() => {
          console.log("Auto-refreshing song info (1 min interval - started on visibility gain).");
          // 인터벌 내에서도 최신 activeStation 참조 필요 (현재 구조에서는 OK)
          fetchAndUpdateSong(activeStation);
        }, 60000); // 1분
      }
    }
  // isPlaying, activeStation, fetchAndUpdateSong이 변경될 때마다 이 핸들러 함수 자체가 새로 생성됨
  }, [isPlaying, activeStation, fetchAndUpdateSong]);

  // --- 재생 시작/중지 시 인터벌 및 초기 로드 관리 useEffect ---
  useEffect(() => {
    // 재생 중지 시 인터벌 클리어
    if (!isPlaying || !activeStation) {
      if (visibilityIntervalRef.current) {
        clearInterval(visibilityIntervalRef.current);
        visibilityIntervalRef.current = null;
        console.log("Playback stopped or no active station, clearing interval.");
      }
      // 정지 시 노래 정보 초기화
      setCurrentSong(null);
      setIsLoadingSong(false);
      setIsSongUnavailable(false);
      return; // 아래 로직 실행 안 함
    }

    // 재생 시작 시:
    // 탭이 활성화 상태일 때만 즉시 정보 로드 및 인터벌 시작
    if (!document.hidden) {
      console.log("Playback started while tab visible. Fetching initial song info and starting interval.");
      fetchAndUpdateSong(activeStation);
      // 기존 인터벌 클리어 후 시작 (혹시 모를 중복 방지)
      if (visibilityIntervalRef.current) clearInterval(visibilityIntervalRef.current);
      visibilityIntervalRef.current = setInterval(() => {
         console.log("Auto-refreshing song info (1 min interval - started on play).");
         fetchAndUpdateSong(activeStation);
      }, 60000);
    } else {
      console.log("Playback started while tab hidden. Will fetch info when tab becomes visible.");
      // 탭 숨겨진 상태면 아무것도 안 함 (visibilitychange 핸들러가 처리)
    }

    // isPlaying, activeStation 변경 시 이 로직 재실행
  }, [isPlaying, activeStation, fetchAndUpdateSong]);


  // --- 탭 활성화 감지 useEffect 수정 ---
  useEffect(() => {
    // handleVisibilityChange 함수는 이제 useCallback으로 생성된 안정적인 참조
    document.addEventListener('visibilitychange', handleVisibilityChange);
    console.log("Visibility change listener added.");

    // 클린업 함수: 리스너 제거 및 인터벌 클리어
    return () => {
      console.log("Removing visibility change listener and clearing interval.");
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityIntervalRef.current) {
        clearInterval(visibilityIntervalRef.current);
        visibilityIntervalRef.current = null; // 클린업 시 확실히 null로 설정
      }
    };
    // handleVisibilityChange 함수 자체가 의존성을 가지므로, 이 함수를 의존성 배열에 넣는다.
  }, [handleVisibilityChange]);

  // --- 수동 새로고침 핸들러 ---
  const handleManualRefreshSong = useCallback(() => {
    if (!activeStation || isLoadingSong) {
      toast.info("Cannot refresh now", { description: isLoadingSong ? "Already loading..." : "No active station."});
      return;
    }
    console.log("Manual refresh requested.");
    toast.info("Refreshing song info...");
    fetchAndUpdateSong(activeStation);
  }, [activeStation, isLoadingSong, fetchAndUpdateSong]);


  // --- 핸들러 함수 (useCallback) ---
  const toggleFavorite = useCallback((stationToToggle: RadioStation) => {
    setFavoritedStations(prev => {
      const isFav = prev.some(s => s.streamUrl === stationToToggle.streamUrl);
      if (isFav) {
        toast.info(`${stationToToggle.name} removed from favorites`);
        return prev.filter(s => s.streamUrl !== stationToToggle.streamUrl);
      } else {
        toast.success(`${stationToToggle.name} added to favorites`);
        return [...prev, stationToToggle];
      }
    });
  }, []);

  const isFavorite = useCallback((station: RadioStation): boolean =>
    favoritedStations.some(fav => fav.streamUrl === station.streamUrl)
  , [favoritedStations]);

  const handleSaveSong = useCallback(() => {
    if (!currentSong || !activeStation) {
        toast.error("Cannot save song", { description: "No song info." }); return;
    }
    const parts = currentSong.split(' - ');
    const title = parts.length >= 2 ? parts.slice(1).join(' - ').trim() : currentSong;
    const artist = parts.length >= 2 ? parts[0].trim() : undefined;
    const newSong: SavedSong = {
        id: Date.now(), title, artist, stationName: activeStation.name,
        savedAt: Date.now(), streamUrl: activeStation.streamUrl
    };
    const minuteAgo = Date.now() - 60000;
    const exists = savedSongs.some(s => s.title === title && s.artist === artist && s.stationName === newSong.stationName && s.savedAt > minuteAgo);
    if (exists) {
        toast.info("Song already saved recently");
    } else {
        setSavedSongs(prev => [newSong, ...prev]);
        toast.success("Song saved!");
    }
  }, [currentSong, activeStation, savedSongs]);

  const handleDeleteSong = useCallback((idToDelete: number) => {
    setSavedSongs(prev => prev.filter(song => song.id !== idToDelete));
    toast.info("Saved song removed.");
  }, []);

  const stopStation = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsConnectingStation(false);
  }, []);

// ... existing code ...
const playStation = useCallback((station: RadioStation, game: Game | null) => {
  if (isConnectingStation) return;
  setIsConnectingStation(true);

  stopStation();

  setActiveStation(station);
  setActiveGame(game ?? (ets2Stations.some(s => s.streamUrl === station.streamUrl) ? 'ETS2' : 'ATS'));

  // 1. 무조건 시도하는 스트림 주소 로그
  console.log('Trying to play:', station.streamUrl);

  // ... 이하 기존 코드 ...
  const safeUrl = station.streamUrl.startsWith('https://') ? station.streamUrl : station.streamUrl;

  const testAudio = document.createElement('audio');
  if (!testAudio.canPlayType('audio/mpeg') && !testAudio.canPlayType('audio/aac')) {
    toast.error('Unsupported Format', { description: 'Your browser does not support this audio format.' });
    setIsConnectingStation(false);
    // 2. 포맷 미지원도 터미널에 로그
    console.error('Not supported audio format:', station.streamUrl);
    return;
  }

  const newAudio = new Audio(safeUrl);
  audioRef.current = newAudio;
  newAudio.volume = volume / 100;

  const errorListener = (e: Event) => {
    const err = (e.target as HTMLAudioElement).error;
    if (err?.code === 4) {
      toast.error('Format Error', { description: 'This station uses an unsupported audio format in your browser.' });
    } else {
      toast.error('Stream Error', { description: `Failed to play ${station.name}. Code: ${err?.code}` });
    }
    // 3. 에러 발생 시도 주소도 로그
    console.error('Audio error for:', station.streamUrl, 'Error:', err);
    stopStation();
    newAudio.removeEventListener('error', errorListener);
  };

  newAudio.addEventListener('error', errorListener);

  newAudio.play()
    .then(() => {
      setIsPlaying(true);
      setIsConnectingStation(false);
      toast.success('Playing Station', { description: `Now playing: ${station.name}` });
    })
    .catch((playError) => {
      if (playError.name === 'NotSupportedError') {
        toast.error('Not Supported', { description: 'Failed to load because no supported source was found.' });
      } else {
        toast.error('Playback Error', { description: `Could not start ${station.name}.` });
      }
      setIsConnectingStation(false);
      setIsPlaying(false);
      // 4. play() 실패도 주소 로그
      console.error('Failed to play:', station.streamUrl, playError);
      newAudio.removeEventListener('error', errorListener);
      stopStation();
    });
}, [volume, ets2Stations, stopStation, isConnectingStation]);

  const filterStations = useCallback((stations: RadioStation[]) => stations.filter(station =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedGenre || station.genre === selectedGenre)
  ), [searchQuery, selectedGenre]);

  const filteredEts2Stations = useMemo(() => filterStations(ets2Stations), [ets2Stations, filterStations]);
  const filteredAtsStations = useMemo(() => filterStations(atsStations), [atsStations, filterStations]);
  const filteredFavoritedStations = useMemo(() =>
    favoritedStations.filter(station => station.name.toLowerCase().includes(searchQuery.toLowerCase()))
  , [favoritedStations, searchQuery]);
  const filteredSavedSongs = useMemo(() => {
    if (!searchQuery) return savedSongs;
    const query = searchQuery.toLowerCase();
    return savedSongs.filter(s =>
        s.title.toLowerCase().includes(query) ||
        (s.artist && s.artist.toLowerCase().includes(query)) ||
        s.stationName.toLowerCase().includes(query)
    );
  }, [savedSongs, searchQuery]);
  // --- 현재 화면에 보이는 방송국 목록 계산 ---
  const currentVisibleStations = useMemo(() => {
    switch (activeTab) {
      case 'ets2': return filteredEts2Stations;
      case 'ats': return filteredAtsStations;
      case 'favorites': return filteredFavoritedStations;
      default: return []; // Saved 탭이나 다른 경우는 빈 배열
    }
  }, [activeTab, filteredEts2Stations, filteredAtsStations, filteredFavoritedStations]);

  const allStations = useMemo(() => [...ets2Stations, ...atsStations], [ets2Stations, atsStations]);

  // 이전 곡 (항상 전체 목록 기준 순환)
  const handlePrevStation = useCallback(() => {
    // 현재 보이는 목록이나 활성 스테이션 없으면 중단
    if (!activeStation || currentVisibleStations.length < 2) return;

    const currentIndex = currentVisibleStations.findIndex(s => s.streamUrl === activeStation.streamUrl);
    if (currentIndex === -1) {
      // 현재 재생 중인 곡이 필터링된 목록에 없을 수도 있음 (예: 즐겨찾기 재생 중 ETS2 탭 보기)
      // 이 경우, 목록의 첫번째 또는 마지막 곡으로 이동하거나, 동작하지 않게 할 수 있음. 여기선 동작 안 함.
      console.warn("Active station not found in the current visible list.");
      return;
    }

    const prevIndex = (currentIndex - 1 + currentVisibleStations.length) % currentVisibleStations.length;
    const prevStation = currentVisibleStations[prevIndex];
    // 게임 타입 결정 (ETS2 목록 확인)
    const game = ets2Stations.some(s => s.streamUrl === prevStation.streamUrl) ? 'ETS2' : 'ATS';
    playStation(prevStation, game);

  // 의존성 배열 업데이트
  }, [activeStation, currentVisibleStations, playStation, ets2Stations]);

  // --- 다음 곡 핸들러 수정 ---
  const handleNextStation = useCallback(() => {
    // 현재 보이는 목록이나 활성 스테이션 없으면 중단
    if (!activeStation || currentVisibleStations.length < 2) return;

    const currentIndex = currentVisibleStations.findIndex(s => s.streamUrl === activeStation.streamUrl);
     if (currentIndex === -1) {
        console.warn("Active station not found in the current visible list.");
        return;
    }

    const nextIndex = (currentIndex + 1) % currentVisibleStations.length;
    const nextStation = currentVisibleStations[nextIndex];
    const game = ets2Stations.some(s => s.streamUrl === nextStation.streamUrl) ? 'ETS2' : 'ATS';
    playStation(nextStation, game);

  // 의존성 배열 업데이트
  }, [activeStation, currentVisibleStations, playStation, ets2Stations]);

  const handleRandomStation = useCallback(() => {
    if (allStations.length === 0) { toast.info("No stations available"); return; }
    const randomIndex = Math.floor(Math.random() * allStations.length);
    const randomStation = allStations[randomIndex];
    const game = ets2Stations.some(s => s.streamUrl === randomStation.streamUrl) ? 'ETS2' : 'ATS';
    playStation(randomStation, game);
  }, [allStations, ets2Stations, playStation]);

  // --- 필터링 로직 (useMemo, useCallback) ---
  const genres = useMemo(() => [...new Set(allStations.map(s => s.genre).filter(Boolean))].sort(), [allStations]);


  
  // --- 렌더링 ---
  // 이전/다음 버튼 비활성화 조건 계산
  const isPrevNextDisabled = currentVisibleStations.length < 2 || activeTab === 'savedSongs';

  return (
    <div className="container mx-auto pt-4 pb-24 px-4">
      <h1 className="text-2xl font-bold mb-4">Trucker Tunes</h1>

      {/* 검색 & 랜덤 */}
      <div className="mb-4 flex flex-col sm:flex-row items-center gap-4">
        <Input
          type="text"
          placeholder="Search stations or saved songs..." // 플레이스홀더 변경
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleRandomStation} variant="outline" disabled={allStations.length === 0} className="w-full sm:w-auto">
          <Shuffle className="mr-2 h-4 w-4" /> Random Station
        </Button>
      </div>

      {/* 장르 필터 */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Filter by Genre:</p>
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="flex space-x-2">
            <Button size="sm" variant={!selectedGenre ? 'secondary' : 'ghost'} onClick={() => setSelectedGenre(null)} className={cn("rounded-full", !selectedGenre && "border border-primary")}>All Genres</Button>
            {genres.map((genre) => (
              <Button size="sm" key={genre} variant={selectedGenre === genre ? 'secondary' : 'ghost'} onClick={() => setSelectedGenre(genre)} className={cn("rounded-full", selectedGenre === genre && "border border-primary")}>{genre}</Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* 탭: value와 onValueChange 추가 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="ets2" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ets2">ETS2 ({filteredEts2Stations.length})</TabsTrigger>
          <TabsTrigger value="ats">ATS ({filteredAtsStations.length})</TabsTrigger>
          <TabsTrigger value="favorites"><Star className="w-4 h-4 mr-1" /> Favorites ({filteredFavoritedStations.length})</TabsTrigger>
          <TabsTrigger value="savedSongs"><ListMusic className="w-4 h-4 mr-1" /> Saved ({filteredSavedSongs.length})</TabsTrigger>
        </TabsList>

        {/* 탭 컨텐츠 */}
        <TabsContent value="ets2"><StationList stations={filteredEts2Stations} game="ETS2" onPlay={playStation} onToggleFavorite={toggleFavorite} isFavorite={isFavorite} /></TabsContent>
        <TabsContent value="ats"><StationList stations={filteredAtsStations} game="ATS" onPlay={playStation} onToggleFavorite={toggleFavorite} isFavorite={isFavorite} /></TabsContent>
        <TabsContent value="favorites"><StationList stations={filteredFavoritedStations} game={null} onPlay={playStation} onToggleFavorite={toggleFavorite} isFavorite={isFavorite} /></TabsContent>
        <TabsContent value="savedSongs"><SavedSongsList songs={filteredSavedSongs} onDeleteSong={handleDeleteSong} /></TabsContent>
      </Tabs>

      {/* 하단 플레이어 */}
      <Player
        activeStation={activeStation}
        activeGame={activeGame}
        isPlaying={isPlaying}
        isConnectingStation={isConnectingStation}
        playStation={playStation}
        stopStation={stopStation}
        handlePrevStation={handlePrevStation}
        handleNextStation={handleNextStation}
        isPrevNextDisabled={isPrevNextDisabled} // 비활성화 조건 전달
        handleRandomStation={handleRandomStation}
        volume={volume}
        setVolume={setVolume}
        stations={allStations}
        currentSong={currentSong}
        isLoadingSong={isLoadingSong}
        isSongUnavailable={isSongUnavailable}
        onSaveSong={handleSaveSong}
        onRefreshSong={handleManualRefreshSong} // 새로고침 핸들러 전달
      />
    </div>
  );
}