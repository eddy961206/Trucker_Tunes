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
} from 'lucide-react'; // 필요한 아이콘만 남기거나 Player 등에서 가져오도록 수정 가능


export default function Home() {
  // --- 상태 관리 ---
  const [ets2Stations, setEts2Stations] = useState<RadioStation[]>([]);
  const [atsStations, setAtsStations] = useState<RadioStation[]>([]);
  const [activeStation, setActiveStation] = useState<RadioStation | null>(null);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [volume, setVolume] = useState(50);
  const [favoritedStations, setFavoritedStations] = useState<RadioStation[]>([]);
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>([]);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [isLoadingSong, setIsLoadingSong] = useState(false);
  const [isSongUnavailable, setIsSongUnavailable] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

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

  // --- 현재 곡 정보 주기적 업데이트 ---
  const fetchAndUpdateSong = useCallback(async (station: RadioStation | null) => {
    if (!station?.streamUrl) {
        setCurrentSong(null); setIsLoadingSong(false); setIsSongUnavailable(false); return;
    }
    try {
        const song = await getCurrentSong(station.streamUrl);
        setCurrentSong(prev => song === prev ? prev : (setIsSongUnavailable(!song), song));
    } catch (error) {
        console.error("Error fetching song:", error);
        setCurrentSong(prev => prev === null ? prev : (setIsSongUnavailable(true), null));
    } finally {
        // 초기 로딩 시에만 isLoading 변경 고려 (현재는 매번 false로)
        setIsLoadingSong(false);
    }
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPlaying && activeStation) {
        setIsLoadingSong(true); setIsSongUnavailable(false); setCurrentSong(null);
        fetchAndUpdateSong(activeStation); // 즉시 호출
        intervalRef.current = setInterval(() => fetchAndUpdateSong(activeStation), 20000); // 20초
    } else {
        setCurrentSong(null); setIsLoadingSong(false); setIsSongUnavailable(false);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, activeStation, fetchAndUpdateSong]);


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
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        setIsPlaying(false);
        setActiveStation(null);
        setActiveGame(null);
        console.log('Audio stopped.');
    }
  }, []);

  const playStation = useCallback((station: RadioStation, game: Game | null) => {
    const actualGame = game ?? (ets2Stations.some(s => s.streamUrl === station.streamUrl) ? 'ETS2' : 'ATS');
    if (audioRef.current) stopStation(); // 기존 재생 중지 (stopStation 호출로 변경)

    const newAudio = new Audio(station.streamUrl);
    audioRef.current = newAudio;
    newAudio.volume = volume / 100;

    const errorListener = (e: Event) => {
        const err = (e.target as HTMLAudioElement).error;
        console.error('Audio error:', err);
        toast.error('Stream Error', { description: `Failed to play ${station.name}. Code: ${err?.code}` });
        stopStation(); // 에러 시 정지
        newAudio.removeEventListener('error', errorListener);
    };
    newAudio.addEventListener('error', errorListener);

    newAudio.play()
        .then(() => {
            setIsPlaying(true);
            setActiveStation(station);
            setActiveGame(actualGame); // 실제 게임 타입으로 설정
            toast.success('Playing Station', { description: `Now playing: ${station.name}` });
            // 에러 리스너는 play 성공 후에도 유지 (스트리밍 중 에러 대비)
            // stopStation 시 정리될 것임
        })
        .catch((playError) => {
            console.error('Failed to play:', playError);
            toast.error('Playback Error', { description: `Could not start ${station.name}.` });
            newAudio.removeEventListener('error', errorListener); // 에러 리스너 정리
            stopStation();
        });
  }, [volume, ets2Stations, stopStation]); // stopStation 추가, 필요시 atsStations도

  const allStations = useMemo(() => [...ets2Stations, ...atsStations], [ets2Stations, atsStations]);

  const handlePrevStation = useCallback(() => {
    if (!activeStation || allStations.length === 0) return;
    const currentList = activeGame === 'ETS2' ? ets2Stations : activeGame === 'ATS' ? atsStations : allStations;
    let currentIndex = currentList.findIndex(s => s.streamUrl === activeStation.streamUrl);
    if (currentIndex === -1) currentIndex = allStations.findIndex(s => s.streamUrl === activeStation.streamUrl);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + allStations.length) % allStations.length;
    const prevStation = allStations[prevIndex];
    const game = ets2Stations.some(s => s.streamUrl === prevStation.streamUrl) ? 'ETS2' : 'ATS';
    playStation(prevStation, game);
  }, [activeStation, activeGame, ets2Stations, atsStations, allStations, playStation]);

  const handleNextStation = useCallback(() => {
    if (!activeStation || allStations.length === 0) return;
    const currentList = activeGame === 'ETS2' ? ets2Stations : activeGame === 'ATS' ? atsStations : allStations;
    let currentIndex = currentList.findIndex(s => s.streamUrl === activeStation.streamUrl);
    if (currentIndex === -1) currentIndex = allStations.findIndex(s => s.streamUrl === activeStation.streamUrl);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % allStations.length;
    const nextStation = allStations[nextIndex];
    const game = ets2Stations.some(s => s.streamUrl === nextStation.streamUrl) ? 'ETS2' : 'ATS';
    playStation(nextStation, game);
  }, [activeStation, activeGame, ets2Stations, atsStations, allStations, playStation]);

  const handleRandomStation = useCallback(() => {
    if (allStations.length === 0) { toast.info("No stations available"); return; }
    const randomIndex = Math.floor(Math.random() * allStations.length);
    const randomStation = allStations[randomIndex];
    const game = ets2Stations.some(s => s.streamUrl === randomStation.streamUrl) ? 'ETS2' : 'ATS';
    playStation(randomStation, game);
  }, [allStations, ets2Stations, playStation]);

  // --- 필터링 로직 (useMemo, useCallback) ---
  const genres = useMemo(() => [...new Set(allStations.map(s => s.genre).filter(Boolean))].sort(), [allStations]);

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


  // --- 렌더링 ---
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

      {/* 탭 */}
      <Tabs defaultValue="ets2" className="space-y-4">
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
        playStation={playStation}
        stopStation={stopStation}
        handlePrevStation={handlePrevStation}
        handleNextStation={handleNextStation}
        handleRandomStation={handleRandomStation}
        volume={volume}
        setVolume={setVolume}
        stations={allStations}
        currentSong={currentSong}
        isLoadingSong={isLoadingSong}
        isSongUnavailable={isSongUnavailable}
        onSaveSong={handleSaveSong}
      />
    </div>
  );
}