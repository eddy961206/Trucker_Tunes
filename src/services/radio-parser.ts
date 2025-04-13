/**
 * Represents a radio station.
 */
export interface RadioStation {
  /**
   * The name of the radio station.
   */
  name: string;
  /**
   * The URL of the radio stream.
   */
  streamUrl: string;
  /**
   * The genre of the radio station.
   */
  genre: string;
  /**
   * The language of the radio station.
   */
  language: string;
  /**
   * The bitrate of the radio stream.
   */
  bitrate: string;
}

/**
 * Represents a game, either ETS2 or ATS.
 */
export type Game = 'ETS2' | 'ATS';

/**
 * Asynchronously retrieves radio station data from a live_streams.sii file.
 *
 * @param game The game for which to retrieve radio stations.
 * @param fileContent The content of the live_streams.sii file.
 * @returns A promise that resolves to an array of RadioStation objects.
 */
export async function getRadioStations(game: Game, fileContent: string): Promise<RadioStation[]> {
  // TODO: Implement this by parsing the file.
  // Placeholder implementation:
  console.log(`Fetching radio stations for ${game} from file content: ${fileContent}`);

  return [
    {
      name: 'TruckersFM',
      streamUrl: 'https://radio.truckers.fm/',
      genre: 'Sim radio',
      language: 'EN',
      bitrate: '320',
    },
    {
      name: 'Simulator Radio',
      streamUrl: 'http://stream.simulatorradio.com:8002/stream.mp3',
      genre: 'Sim radio',
      language: 'EN',
      bitrate: '128',
    },
  ];
}
