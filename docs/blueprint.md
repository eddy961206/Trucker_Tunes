# **App Name**: Trucker Tunes

## Core Features:

- Data Extraction: Parses `live_streams.sii` files from ETS2 and ATS to extract radio station data (name, URL, genre, language, bitrate).
- Station Display: Displays stations grouped by game (ETS2, ATS) with name, stream URL, genre, language, and bitrate.
- Station Playback & Navigation: Allows users to play selected stations, navigate to the next/previous station, or select by genre.
- Random Station: Implements a "Random" button that plays a random station from both ETS2 and ATS.

## Style Guidelines:

- Use a dark color scheme to reduce eye strain during long drives (simulated, of course).
- Use a color palette inspired by truck dashboards, with oranges, grays, and blacks.
- Accent: Use a vibrant teal (#008080) to highlight interactive elements and the currently playing station.
- Clear separation of ETS2 and ATS stations using tabs or distinct sections.
- Use icons to represent station genres (e.g., rock, pop, country).
- Subtle loading animations when fetching station data or switching stations.

## Original User Request:
A standalone web app that reads **radio station data from ETS2 and ATS’s `live_streams.sii` files**, allowing users to:
- **Browse and play stations** without launching the games  
- View each station's **name, stream URL, genre, language, and bitrate**  
- **Navigate to previous or next channels**, or select by genre  
- Hit **"Random" to play a surprise station** from either game  

On the site, stations are clearly **grouped by ETS2 and ATS**, but **random play includes both**.
  