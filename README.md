# StreamFinder - Streaming Aggregator

A mobile streaming aggregator that combines content from multiple UK platforms (Netflix, Amazon Prime, Apple TV+, Disney+, Now TV, BBC iPlayer, ITVX, Channel 4, Paramount+, Sky Go) into a single browsing interface.

## Tech Stack

- **React Native 0.81** with **Expo 54**
- **React Navigation** (Bottom Tabs + Native Stack)
- **Axios** for API calls
- **AsyncStorage** for local data persistence
- **Expo SecureStore** for secure storage
- **Custom Satoshi Font** for typography

### APIs
- **TMDb API** for content metadata and streaming availability
- **OMDB API** for Rotten Tomatoes and IMDb ratings
- **WatchMode API** for rent/buy pricing information

## Getting Started

### Prerequisites

1. Install Node.js (18+ recommended)
2. Install Expo CLI: `npm install -g expo-cli`
3. Install Expo Go app on your mobile device
4. Get API keys:
   - [TMDb API Key](https://www.themoviedb.org/settings/api)
   - [OMDB API Key](http://www.omdbapi.com/apikey.aspx)
   - [WatchMode API Key](https://api.watchmode.com/)

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
WATCHMODE_API_KEY=your_watchmode_api_key_here
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
│   ├── api/              # API clients (TMDb, OMDB, WatchMode, Cache)
│   ├── screens/          # 8 screen components
│   ├── components/       # 23 reusable UI components
│   ├── navigation/       # Navigation configuration
│   ├── storage/          # AsyncStorage helpers
│   ├── constants/        # Config, colors, platforms, genres
│   ├── context/          # React Context (Theme)
│   ├── theme/            # Design system (dark/light themes)
│   └── utils/            # Error handling, performance utilities
├── assets/
│   ├── fonts/            # Satoshi font family
│   └── platform-logos/   # Streaming service logos
├── docs/
│   └── design-system/    # Figma export tokens and specs
├── App.js                # Main entry point
└── package.json
```

## Features

- **Onboarding Flow**: Name, region, platform selection, genre preferences
- **Home Screen**: Popular, Highest Rated, Recently Added + custom genre sections
- **Browse & Search**: Filter by content type, search across all services
- **Detail View**: Full content info with ratings, cast, and platform availability
- **Profile Management**: Edit details, manage platforms, customize genres
- **Theme Support**: Dark/Light mode with system preference detection
- **Offline Caching**: Intelligent caching with TTL management
- **Error Handling**: User-friendly error messages with retry capability

## Design System

### Theme
- **Dark Theme**: Pure black (#000000) for OLED optimization
- **Light Theme**: Clean white (#FFFFFF) with subtle borders

### Colors
| Token | Dark | Usage |
|-------|------|-------|
| Accent Primary | #FF6B35 | Coral - buttons, highlights |
| Accent Light | #FF8C42 | Hover states |
| Success | #30D158 | Confirmations |
| Warning | #FFD60A | Alerts |
| Error | #FF453A | Errors |

### Typography
- **Font Family**: Satoshi (Light, Regular, Medium)
- **Type Scale**: h1 (34px), h2 (28px), h3 (22px), h4 (20px), body (17px), caption (15px), metadata (13px)

### Spacing
- Base unit: 4px
- Scale: xs (4), sm (8), md (12), lg (16), xl (24), xxl (32), xxxl (48)

### Components (23 total)
- **Layout**: GlassContainer, GlassHeader, BottomSheet
- **Content**: ContentCard, ServiceCard, PlatformChip, PlatformBadge, ProfileAvatar
- **Filters**: SearchBar, FilterChip, FilterModal, FilterSwitch, RatingSlider
- **Display**: RatingBadge, ProgressIndicator, ProgressiveImage, SkeletonLoader, Toast
- **Feedback**: ErrorBoundary, ErrorMessage, EmptyState, EditableField

## Design Export

Design tokens and component specifications for Figma/Pencil are available in:
- `docs/design-system/tokens.json` - Machine-readable design tokens
- `docs/design-system/component-specs.md` - Component specifications

## Documentation

- `THEME_SYSTEM.md` - Theme architecture and usage
- `API_CLIENTS_GUIDE.md` - API integration documentation
- `CACHING_GUIDE.md` - Caching strategy documentation
- `ERROR_HANDLING.md` - Error handling patterns
- `STORAGE_GUIDE.md` - Data persistence guide
- `PERFORMANCE_OPTIMIZATION.md` - Performance best practices

## License

Private project - All rights reserved
