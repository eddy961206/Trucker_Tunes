"use client";

import { useState, useEffect, useRef } from "react";
import { RadioStation, getRadioStations, Game } from "@/services/radio-parser";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Play, Pause, SkipForward, SkipBack, Shuffle, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface PlayerProps {
  activeStation: RadioStation | null;
  isPlaying: boolean;
  onPlay: (station: RadioStation) => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRandom: () => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const Player: React.FC<PlayerProps> = ({
  activeStation,
  isPlaying,
  onPlay,
  onStop,
  onPrev,
  onNext,
  onRandom,
  volume,
  setVolume,
}) => {
  const volumeIcon = volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-secondary/50 backdrop-blur-md border-t border-border z-10">
      <div className="container mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {activeStation ? (
            <div>
              <h2 className="text-lg font-semibold">{activeStation.name}</h2>
              <p className="text-sm text-muted-foreground">{activeStation.genre}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">No station selected</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onPrev} disabled={!activeStation}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={activeStation ? (isPlaying ? onStop : () => onPlay(activeStation)) : null} disabled={!activeStation}>
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext} disabled={!activeStation}>
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRandom}>
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(50);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      const mockFileContent = `
      stream_data[9]: "https://radio.truckers.fm/|TruckersFM|Sim radio|EN|320|1"
      stream_data[10]: "http://stream.simulatorradio.com:8002/stream.mp3|Simulator Radio|Sim radio|EN|128|1"
      `;
      const ets2Data = await getRadioStations("ETS2", mockFileContent);
      const atsData = await getRadioStations("ATS", mockFileContent);

      setEts2Stations(ets2Data);
      setAtsStations(atsData);
    };

    fetchStations();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handlePlay = (station: RadioStation) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const newAudio = new Audio(station.streamUrl);
    audioRef.current = newAudio;
    setAudio(newAudio);
    newAudio.volume = volume / 100;
    newAudio.play();
    setIsPlaying(true);
    setActiveStation(station);

    toast({
      title: "Playing Station",
      description: `Now playing: ${station.name}`,
    });
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setActiveStation(null);
    }
  };

  const handlePrev = () => {
    const allStations = [...ets2Stations, ...atsStations];
    if (!activeStation) return;
    const currentIndex = allStations.findIndex((station) => station.streamUrl === activeStation.streamUrl);
    const prevIndex = (currentIndex - 1 + allStations.length) % allStations.length;
    handlePlay(allStations[prevIndex]);
  };

  const handleNext = () => {
    const allStations = [...ets2Stations, ...atsStations];
    if (!activeStation) return;
    const currentIndex = allStations.findIndex((station) => station.streamUrl === activeStation.streamUrl);
    const nextIndex = (currentIndex + 1) % allStations.length;
    handlePlay(allStations[nextIndex]);
  };

  const handleRandom = () => {
    const allStations = [...ets2Stations, ...atsStations];
    if (allStations.length > 0) {
      const randomIndex = Math.floor(Math.random() * allStations.length);
      handlePlay(allStations[randomIndex]);
    }
  };

  const filteredEts2Stations = ets2Stations.filter((station) =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAtsStations = atsStations.filter((station) =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allStations = [...filteredEts2Stations, ...filteredAtsStations];

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
        <Button onClick={handleRandom} variant="outline">
          <Shuffle className="mr-2 h-4 w-4" />
          Random
        </Button>
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
                  <Button variant="ghost" className="w-full" onClick={() => handlePlay(station)}>{station.name}</Button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="ats">
          <ScrollArea className="h-[400px] w-full rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredAtsStations.map((station) => (
                  <Button variant="ghost" className="w-full" onClick={() => handlePlay(station)}>{station.name}</Button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Player
        activeStation={activeStation}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onStop={handleStop}
        onPrev={handlePrev}
        onNext={handleNext}
        onRandom={handleRandom}
        volume={volume}
        setVolume={setVolume}
      />
    </div>
  );
}
