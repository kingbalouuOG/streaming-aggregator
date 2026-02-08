/**
 * StreamingAggregator - Shared Type Definitions
 *
 * Core types for the streaming aggregator app.
 * These match the web design specifications for pixel-perfect parity.
 */

// ─────────────────────────────────────────────────────────────
// Service Types
// ─────────────────────────────────────────────────────────────

export type ServiceType =
  | 'netflix'
  | 'prime'
  | 'disney'
  | 'hbo'
  | 'hulu'
  | 'apple'
  | 'paramount'
  | 'crunchyroll';

export interface StreamingServiceDef {
  id: ServiceType;
  label: string;
  name: string;
  description: string;
  bgColor: string;
  selectedBorderColor: string;
  textColor?: string;
}

// ─────────────────────────────────────────────────────────────
// Content Types
// ─────────────────────────────────────────────────────────────

export type ContentType = 'movie' | 'tv' | 'doc';

export interface ContentItem {
  id: string;
  title: string;
  image: string;
  services: ServiceType[];
  rating?: number;
  year?: number;
  type?: ContentType;
}

export interface ContentItemDetail extends ContentItem {
  description?: string;
  genres?: string[];
  runtime?: string;
  imdbRating?: number;
  rottenTomatoesScore?: number;
  cast?: CastMember[];
  rentalOptions?: RentalOption[];
}

export interface CastMember {
  id: string;
  name: string;
  character: string;
  image?: string;
}

export interface RentalOption {
  service: ServiceType;
  type: 'buy' | 'rent';
  price: string;
}

// ─────────────────────────────────────────────────────────────
// Filter Types
// ─────────────────────────────────────────────────────────────

export interface FilterState {
  services: ServiceType[];
  contentType: string;
  cost: string;
  genres: string[];
  minRating: number;
}

export const defaultFilters: FilterState = {
  services: [],
  contentType: 'All',
  cost: 'All',
  genres: [],
  minRating: 0,
};

// ─────────────────────────────────────────────────────────────
// User & Onboarding Types
// ─────────────────────────────────────────────────────────────

export interface OnboardingData {
  name: string;
  email: string;
  services: ServiceType[];
  genres: string[];
}

export interface UserProfile extends OnboardingData {
  id?: string;
  createdAt?: Date;
}

// ─────────────────────────────────────────────────────────────
// Theme Types
// ─────────────────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  card: string;

  // Text
  foreground: string;
  mutedForeground: string;

  // Accent
  primary: string;
  primaryForeground: string;
  secondary: string;

  // Semantic
  destructive: string;
  success: string;
  warning: string;

  // Border & Overlay
  border: string;
  borderSubtle: string;
  overlay: string;
  overlaySubtle: string;

  // Platform colors
  platforms: Record<ServiceType, string>;

  // Glass effects
  glass: string;
  glassMedium: string;
  glassHeavy: string;
}

export interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  colors: ThemeColors;
  isDark: boolean;
  isLight: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  isLoading: boolean;
}

// ─────────────────────────────────────────────────────────────
// Animation Types
// ─────────────────────────────────────────────────────────────

export interface SpringConfig {
  tension: number;
  friction: number;
  useNativeDriver: boolean;
}

export interface TimingConfig {
  duration: number;
  useNativeDriver: boolean;
}

// ─────────────────────────────────────────────────────────────
// Navigation Types
// ─────────────────────────────────────────────────────────────

export type TabName = 'home' | 'browse' | 'watchlist' | 'profile';

export type RootStackParamList = {
  Home: undefined;
  Browse: undefined;
  Watchlist: undefined;
  Profile: undefined;
  Detail: { item: ContentItem };
};

// ─────────────────────────────────────────────────────────────
// Component Props Types
// ─────────────────────────────────────────────────────────────

export interface ContentCardProps {
  item: ContentItem & { poster_path?: string };
  onPress?: (item: ContentItem) => void;
  bookmarked?: boolean;
  onToggleBookmark?: (item: ContentItem) => void;
  variant?: 'default' | 'wide' | 'compact';
  showServices?: boolean;
  showRating?: boolean;
  showYear?: boolean;
  userPlatforms?: any[];
  focusKey?: number;
}

export interface ServiceBadgeProps {
  service: ServiceType;
  size?: 'sm' | 'md';
}

export interface FeaturedHeroProps {
  title: string;
  subtitle?: string;
  image: string;
  services: ServiceType[];
  tags?: string[];
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  scrollY: any; // Animated.Value
}

export interface ContentRowProps {
  title: string;
  items: ContentItem[];
  onItemSelect?: (item: ContentItem) => void;
  onSeeAll?: () => void;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (item: ContentItem) => void;
  variant?: 'default' | 'wide';
}

export interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onFilterPress?: () => void;
  hasActiveFilters?: boolean;
}

export interface SwipeableCardProps {
  item: ContentItem;
  onPress?: (item: ContentItem) => void;
  onDelete?: (id: string) => void;
  onMarkWatched?: (id: string) => void;
  onMoveToWantToWatch?: (id: string) => void;
  isWatched?: boolean;
}

export interface BrowseCardProps {
  item: ContentItem & { poster_path?: string };
  index?: number;
  onPress?: (item: ContentItem) => void;
  bookmarked?: boolean;
  onToggleBookmark?: (item: ContentItem) => void;
  userPlatforms?: any[];
  focusKey?: number;
}

// ─────────────────────────────────────────────────────────────
// Genre Constants
// ─────────────────────────────────────────────────────────────

export const allGenres = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
  'Horror', 'Music', 'Mystery', 'Romance', 'Sci-Fi',
  'Thriller', 'War', 'Western',
] as const;

export type Genre = typeof allGenres[number];

export const genreIcons: Record<Genre, string> = {
  Action: '💥',
  Adventure: '🗺️',
  Animation: '✨',
  Comedy: '😂',
  Crime: '🔍',
  Documentary: '🎬',
  Drama: '🎭',
  Family: '👨‍👩‍👧‍👦',
  Fantasy: '🐉',
  History: '📜',
  Horror: '👻',
  Music: '🎵',
  Mystery: '🕵️',
  Romance: '❤️',
  'Sci-Fi': '🚀',
  Thriller: '😱',
  War: '⚔️',
  Western: '🤠',
};

// ─────────────────────────────────────────────────────────────
// Service Constants
// ─────────────────────────────────────────────────────────────

export const allServices: StreamingServiceDef[] = [
  { id: 'netflix', label: 'N', name: 'Netflix', description: 'Movies & Series', bgColor: '#E50914', selectedBorderColor: '#EF4444' },
  { id: 'prime', label: 'P', name: 'Prime Video', description: 'Amazon Originals', bgColor: '#00A8E1', selectedBorderColor: '#60A5FA' },
  { id: 'apple', label: 'tv', name: 'Apple TV+', description: 'Apple Originals', bgColor: '#374151', selectedBorderColor: '#9CA3AF', textColor: 'rgba(255,255,255,0.6)' },
  { id: 'disney', label: 'D+', name: 'Disney+', description: 'Disney, Marvel, Star Wars', bgColor: '#113CCF', selectedBorderColor: '#3B82F6' },
  { id: 'hbo', label: 'M', name: 'Max', description: 'HBO & Discovery', bgColor: '#5C16C5', selectedBorderColor: '#A855F7' },
  { id: 'paramount', label: 'P+', name: 'Paramount+', description: 'CBS & Paramount', bgColor: '#1E3A8A', selectedBorderColor: '#60A5FA' },
  { id: 'hulu', label: 'H', name: 'Hulu', description: 'TV & Live Sports', bgColor: '#1CE783', selectedBorderColor: '#4ADE80' },
  { id: 'crunchyroll', label: 'CR', name: 'Crunchyroll', description: 'Anime & Manga', bgColor: '#F47521', selectedBorderColor: '#FB923C' },
];

// ─────────────────────────────────────────────────────────────
// Category Constants
// ─────────────────────────────────────────────────────────────

export const categories = ['All', 'Movies', 'TV Shows', 'Docs', 'Anime'] as const;
export type Category = typeof categories[number];

export const contentTypes = ['All', 'Movies', 'TV', 'Docs'] as const;
export const costOptions = ['All', 'Free', 'Paid'] as const;
