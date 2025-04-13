'use client';

import {useState, useEffect, useRef, useCallback} from 'react';
import {RadioStation, getRadioStations, Game} from '@/services/radio-parser';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {useToast} from '@/hooks/use-toast';
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
} from 'lucide-react';
import {Slider} from '@/components/ui/slider';
import {useRouter} from 'next/navigation';
import {toast} from 'sonner';

async function getCurrentSong(streamUrl: string): Promise<string | null> {
  'use server';

  try {
    const res = await fetch(`/api/get-song?url=${streamUrl}`);
    if (!res.ok) {
      console.error(`Failed to fetch song info: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    return data.song || null;
  } catch (error) {
    console.error('Error fetching current song:', error);
    return null;
  }
}

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
  stations: RadioStation[];
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
}) => {
  const volumeIcon = volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />;
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [isLoadingSong, setIsLoadingSong] = useState(false);

  useEffect(() => {
    const fetchSong = async () => {
      if (activeStation) {
        setIsLoadingSong(true);
        const song = await getCurrentSong(activeStation.streamUrl);
        setCurrentSong(song);
        setIsLoadingSong(false);
      } else {
        setCurrentSong(null);
      }
    };

    fetchSong();
  }, [activeStation]);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-secondary/50 backdrop-blur-md border-t border-border z-10">
      <div className="container mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {activeStation ? (
            <div>
              <h2 className="text-lg font-semibold">{activeStation.name}</h2>
              <p className="text-sm text-muted-foreground">
                {activeStation.genre} ({activeGame})
              </p>
              {isLoadingSong ? (
                <p className="text-sm text-muted-foreground">Loading song...</p>
              ) : currentSong ? (
                <p className="text-sm text-muted-foreground">Now playing: {currentSong}</p>
              ) : (
                activeStation.streamUrl && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Song information not available. <br />
                    <span className="text-xs">URL: {activeStation.streamUrl}</span>
                  </p>
                )
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No station selected</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={handlePrevStation} disabled={stations.length === 0}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={activeStation ? (isPlaying ? stopStation : () => playStation(activeStation, activeGame!)) : null}
            disabled={stations.length === 0}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextStation} disabled={stations.length === 0}>
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRandomStation}>
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2 w-32">
          {volumeIcon}
          <Slider
            min={0}
            max={100}
            step={1}
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            aria-label="Volume"
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
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(50);
  const {toast} = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStations = async () => {
      try {
        // Fetch ETS2 stations
        const ets2Response = await fetch('/data/ETS2_live_streams.sii');
        if (!ets2Response.ok) {
          throw new Error(`Failed to fetch ETS2 stations: ${ets2Response.statusText}`);
        }
        const ets2FileContent = await ets2Response.text();
        const ets2Data = await getRadioStations('ETS2', ets2FileContent);
        setEts2Stations(ets2Data);

        // Fetch ATS stations
        const atsResponse = await fetch('/data/ATS_live_streams.sii');
        if (!atsResponse.ok) {
          throw new Error(`Failed to fetch ATS stations: ${atsResponse.statusText}`);
        }
        const atsFileContent = await atsResponse.text();
        const atsData = await getRadioStations('ATS', atsFileContent);
        setAtsStations(atsData);
      } catch (error) {
        console.error('Error fetching or parsing station data:', error);
        toast({
          title: 'Error loading stations',
          description: 'Could not load radio station data. Please check the console for details.',
          variant: 'destructive',
        });
      }
    };

    fetchStations();
  }, [toast]); // Add toast to dependency array

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const playStation = useCallback(
    (station: RadioStation, game: Game) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      const newAudio = new Audio(station.streamUrl);
      audioRef.current = newAudio;
      setAudio(newAudio);
      newAudio.volume = volume / 100;

      // Event listener for stream errors
      const audioErrorListener = (error: Event) => {
        console.error('Audio stream error:', error);
        toast({
          title: 'Stream Error',
          description: `Failed to play ${station.name}. Please check the stream URL or try again later.`,
          variant: 'destructive',
        });
        stopStation(); // Stop the player
      };

      newAudio.addEventListener('error', audioErrorListener);

      newAudio
        .play()
        .then(() => {
          setIsPlaying(true);
          setActiveStation(station);
          setActiveGame(game);
          toast({
            title: 'Playing Station',
            description: `Now playing: ${station.name}`,
          });
        })
        .catch((playError) => {
          console.error('Failed to play audio:', playError);
          toast({
            title: 'Playback Error',
            description: `Failed to start playback for ${station.name}. Please check the console for details.`,
            variant: 'destructive',
          });
          newAudio.removeEventListener('error', audioErrorListener); // Clean up listener
          stopStation(); // Stop the player
        });

      // Cleanup function
      return () => {
        newAudio.removeEventListener('error', audioErrorListener);
      };
    },
    [volume, toast]
  );

  const stopStation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setActiveStation(null);
      setActiveGame(null);
    }
  };

  const handlePrevStation = () => {
    if (!activeStation) return;
    const currentStationIndex = ets2Stations.findIndex((s) => s.streamUrl === activeStation.streamUrl);
    const newIndex = (currentStationIndex - 1 + ets2Stations.length) % ets2Stations.length;
    playStation(ets2Stations[newIndex], 'ETS2');
  };

  const handleNextStation = () => {
    if (!activeStation) return;
    const currentStationIndex = ets2Stations.findIndex((s) => s.streamUrl === activeStation.streamUrl);
    const newIndex = (currentStationIndex + 1) % ets2Stations.length;
    playStation(ets2Stations[newIndex], 'ETS2');
  };

  const handleRandomStation = () => {
    const allStations = [...ets2Stations, ...atsStations];
    if (allStations.length > 0) {
      const randomIndex = Math.floor(Math.random() * allStations.length);
      const randomStation = allStations[randomIndex];
      const game = ets2Stations.includes(randomStation) ? 'ETS2' : 'ATS';
      playStation(randomStation, game);
    }
  };

  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const genres = [...new Set([...ets2Stations, ...atsStations].map((station) => station.genre))];

  const filteredEts2Stations = ets2Stations.filter((station) => {
    const searchMatch = station.name.toLowerCase().includes(searchQuery.toLowerCase());
    const genreMatch = selectedGenre ? station.genre === selectedGenre : true;
    return searchMatch && genreMatch;
  });

  const filteredAtsStations = atsStations.filter((station) => {
    const searchMatch = station.name.toLowerCase().includes(searchQuery.toLowerCase());
    const genreMatch = selectedGenre ? station.genre === selectedGenre : true;
    return searchMatch && genreMatch;
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Trucker Tunes</h1>

      <div className="mb-4 flex items-center space-x-4">
        <Input
          type="text"
          placeholder="Search stations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button onClick={handleRandomStation} variant="outline">
          <Shuffle className="mr-2 h-4 w-4" />
          Random
        </Button>
      </div>

      <div className="mb-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-2">
            <Button
              variant={selectedGenre ? 'ghost' : 'outline'}
              onClick={() => setSelectedGenre(null)}
            >
              All Genres
            </Button>
            {genres.map((genre) => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? 'outline' : 'ghost'}
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Tabs defaultValue="ets2" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ets2">Euro Truck Simulator 2</TabsTrigger>
          <TabsTrigger value="ats">American Truck Simulator</TabsTrigger>
        </TabsList>
        <TabsContent value="ets2">
          <ScrollArea className="h-[400px] w-full rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredEts2Stations.map((station) => (
                <Button variant="ghost" className="w-full" key={station.streamUrl} onClick={() => playStation(station, 'ETS2')}>
                  {station.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="ats">
          <ScrollArea className="h-[400px] w-full rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredAtsStations.map((station) => (
                <Button variant="ghost" className="w-full" key={station.streamUrl} onClick={() => playStation(station, 'ATS')}>
                  {station.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

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
        stations={[...ets2Stations, ...atsStations]}
      />
    </div>
  );
}
