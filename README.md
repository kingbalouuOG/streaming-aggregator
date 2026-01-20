# StreamFinder - Streaming Aggregator

A mobile streaming aggregator that combines content from multiple UK platforms (Netflix, Amazon Prime, Apple TV+, Disney+, and more) into a single browsing interface.

## Tech Stack

- **React Native** with **Expo**
- **React Navigation** for navigation
- **Axios** for API calls
- **AsyncStorage** for local data persistence
- **TMDb API** for content metadata
- **OMDB API** for ratings

## Getting Started

### Prerequisites

1. Install Node.js (18+ recommended)
2. Install Expo CLI: `npm install -g expo-cli`
3. Install Expo Go app on your mobile device
4. Get API keys:
   - [TMDb API Key](https://www.themoviedb.org/settings/api)
   - [OMDB API Key](http://www.omdbapi.com/apikey.aspx)

### Installation

1. Navigate to the project directory:
```bash
cd streaming-aggregator
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from template:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```
TMDB_API_KEY=your_tmdb_api_key_here
OMDB_API_KEY=your_omdb_api_key_here
```

### Running the App

Start the development server:
```bash
npx expo start
```

Then:
- Scan the QR code with Expo Go (Android) or Camera app (iOS)
- Press `a` for Android emulator
- Press `i` for iOS simulator (macOS only)
- Press `w` for web browser

## Project Structure

```
streaming-aggregator/
├── src/
│   ├── api/              # API clients (TMDb, OMDB)
│   ├── screens/          # Screen components
│   ├── components/       # Reusable components
│   ├── navigation/       # Navigation configuration
│   ├── storage/          # AsyncStorage helpers
│   ├── constants/        # Colors, typography, platforms, genres
│   └── theme/            # Design system implementation
├── App.js               # Main entry point
└── package.json
```

## Features (V1)

- Streamlined onboarding (name, email, platform selection)
- Browse content from multiple platforms
- Filter by content type (Movies, TV, Documentaries)
- Search across all services
- Detailed content view with ratings
- Glass morphism dark theme UI

## Design System

- Dark theme with glass morphism effects
- Pure black backgrounds (#000000)
- Accent colors: #FF375F (primary), #00D9FF (secondary)
- System fonts (SF Pro Display on iOS, Roboto on Android)

## API Configuration

The app uses:
- **TMDb API** for content metadata and streaming availability
- **OMDB API** for Rotten Tomatoes and IMDb ratings

UK region code: `GB`

## License

Private project - All rights reserved
