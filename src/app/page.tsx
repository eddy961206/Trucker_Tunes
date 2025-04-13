"use client";

import { useState, useEffect } from "react";
import { RadioStation, getRadioStations, Game } from "@/services/radio-parser";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Play, Pause, SkipForward, SkipBack, Shuffle } from "lucide-react";

interface StationCardProps {
  station: RadioStation;
  isPlaying: boolean;
  onPlay: (station: RadioStation) => void;
  onStop: () => void;
  activeStation: RadioStation | null;
}

const StationCard: React.FC<StationCardProps> = ({ station, isPlaying, onPlay, onStop, activeStation }) => {
  const isActive = activeStation && activeStation.streamUrl === station.streamUrl;

  return (
    <Card className={cn("shadow-md hover:shadow-lg transition-shadow duration-300", isActive ? "border-2 border-accent" : "")}>
      <CardHeader>
        <CardTitle>{station.name}</CardTitle>
        <CardDescription>Genre: {station.genre}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Language: {station.language}</p>
        <p>Bitrate: {station.bitrate}</p>
      </CardContent>
      <CardFooter className="justify-between">
        {isActive ? (
          <Button variant="secondary" onClick={onStop}>
            <Pause className="mr-2 h-4 w-4" />
            Stop
          </Button>
        ) : (
          <Button onClick={() => onPlay(station)}>
            <Play className="mr-2 h-4 w-4" />
            Play
          </Button>
        )}
        <a href={station.streamUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground">
          Stream URL
        </a>
      </CardFooter>
    </Card>
  );
};

export default function Home() {
  const [ets2Stations, setEts2Stations] = useState<RadioStation[]>([]);
  const [atsStations, setAtsStations] = useState<RadioStation[]>([]);
  const [activeStation, setActiveStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStations = async () => {
      // Placeholder implementation: Replace with actual file parsing.
      const mockFileContent = "example sii file content";
      const ets2Data = await getRadioStations("ETS2", mockFileContent);
      const atsData = await getRadioStations("ATS", mockFileContent);

      setEts2Stations(ets2Data);
      setAtsStations(atsData);
    };

    fetchStations();
  }, []);

  const handlePlay = (station: RadioStation) => {
    if (audio) {
      audio.pause();
    }

    const newAudio = new Audio(station.streamUrl);
    setAudio(newAudio);
    newAudio.play();
    setIsPlaying(true);
    setActiveStation(station);

    toast({
      title: "Playing Station",
      description: `Now playing: ${station.name}`,
    });
  };

  const handleStop = () => {
    if (audio) {
      audio.pause();
      setIsPlaying(false);
      setActiveStation(null);
    }
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
                <StationCard
                  key={station.streamUrl}
                  station={station}
                  isPlaying={isPlaying}
                  onPlay={handlePlay}
                  onStop={handleStop}
                  activeStation={activeStation}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="ats">
          <ScrollArea className="h-[400px] w-full rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredAtsStations.map((station) => (
                <StationCard
                  key={station.streamUrl}
                  station={station}
                  isPlaying={isPlaying}
                  onPlay={handlePlay}
                  onStop={handleStop}
                  activeStation={activeStation}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
