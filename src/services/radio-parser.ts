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
 * Asynchronously retrieves radio station data from a live_streams.sii file content.
 *
 * @param game The game associated with the file content (ETS2 or ATS). Used for logging/context.
 * @param fileContent The content of the live_streams.sii file.
 * @returns A promise that resolves to an array of RadioStation objects.
 */
export async function getRadioStations(game: Game, fileContent: string): Promise<RadioStation[]> {
  const stations: RadioStation[] = [];
  const lines = fileContent.split('\n');

  // Regex to match lines like: stream_data[0]: "url|name|genre|lang|bitrate|fav"
  const lineRegex = /^\s*stream_data\[\d+\]:\s*"([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|[^"]*"\s*$/;

  for (const line of lines) {
    const match = line.trim().match(lineRegex);

    if (match) {
      // Extract captured groups: streamUrl, name, genre, language, bitrate
      const [, streamUrl, name, genre, language, bitrate] = match;
      stations.push({
        name: name.trim(), // Trim whitespace from parsed values
        streamUrl: streamUrl.trim(),
        genre: genre.trim(),
        language: language.trim(),
        bitrate: bitrate.trim(),
      });
    }
  }

  console.log(`Parsed ${stations.length} stations for ${game} from provided content.`);
  return stations;
}
