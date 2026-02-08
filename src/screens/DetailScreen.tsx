/**
 * DetailScreen
 *
 * Pixel-perfect recreation of web detail page
 * Features: Hero image, ratings, genres, cast, recommendations
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { ImageSkeleton } from '../components/ImageSkeleton';
import { ServiceBadgeRow, ServiceBadge } from '../components/ServiceBadge';
import { ContentCard } from '../components/ContentCard';
import { getMovieDetails, getTVDetails } from '../api/tmdb';
import { getRatings } from '../api/omdb';
import { normalizePlatformName, mapProviderIdToCanonical } from '../constants/platforms';
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from '../storage/watchlist';
import { ContentItem, ServiceType } from '../types';
import { logError } from '../utils/errorHandler';
import { layout } from '../theme/spacing';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_ASPECT_RATIO = 4 / 3;

const SERVICE_LABELS: Record<string, string> = {
  netflix: 'Netflix',
  prime: 'Amazon Prime Video',
  hulu: 'Hulu',
  disney: 'Disney+',
  hbo: 'Max',
  apple: 'Apple TV+',
  paramount: 'Paramount+',
  crunchyroll: 'Crunchyroll',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface DetailScreenProps {
  route: any;
  navigation: any;
}

const DetailScreen: React.FC<DetailScreenProps> = ({ route, navigation }) => {
  const { itemId, type = 'movie' } = route.params || {};
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // State
  const [content, setContent] = useState<any>(null);
  const [ratings, setRatings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [cast, setCast] = useState<any[]>([]);

  // Animation
  const bookmarkScale = useSharedValue(1);

  const bookmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  // Load content
  useEffect(() => {
    let isCancelled = false;

    const loadContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch TMDb details
        const response = type === 'movie'
          ? await getMovieDetails(itemId, { append_to_response: 'credits,watch/providers,external_ids' })
          : await getTVDetails(itemId, { append_to_response: 'credits,watch/providers,external_ids' });

        if (isCancelled) return;

        if (response.success) {
          setContent(response.data);

          // Extract services
          const providers = response.data['watch/providers']?.results?.GB || response.data['watch/providers']?.results?.US;
          if (providers?.flatrate) {
            const serviceIds = providers.flatrate
              .map((p: any) => mapProviderIdToCanonical(p.provider_id))
              .filter((id: string | null): id is ServiceType =>
                ['netflix', 'prime', 'disney', 'hbo', 'hulu', 'apple', 'paramount', 'crunchyroll'].includes(id as string)
              );
            setServices(serviceIds.slice(0, 4) as ServiceType[]);
          }

          // Extract cast
          if (response.data.credits?.cast) {
            setCast(response.data.credits.cast.slice(0, 10));
          }

          // Fetch OMDB ratings
          const imdbId = response.data.external_ids?.imdb_id;
          if (imdbId && !isCancelled) {
            try {
              const ratingsResponse = await getRatings(imdbId, type);
              if (!isCancelled && ratingsResponse.success) {
                setRatings(ratingsResponse.data);
              }
            } catch (e) {
              console.log('[DetailScreen] Could not fetch ratings');
            }
          }

          // Check watchlist status
          const inList = await isInWatchlist(itemId, type);
          if (!isCancelled) setIsBookmarked(inList);
        } else {
          setError(new Error('Failed to load content'));
        }
      } catch (err) {
        if (!isCancelled) {
          logError(err as Error, 'DetailScreen loadContent');
          setError(err as Error);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadContent();
    return () => { isCancelled = true; };
  }, [itemId, type]);

  // Helpers
  const getBackdropUrl = () => {
    if (!content) return '';
    return content.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${content.backdrop_path}`
      : content.poster_path
        ? `https://image.tmdb.org/t/p/w780${content.poster_path}`
        : '';
  };

  const getYear = () => {
    if (!content) return '';
    const date = content.release_date || content.first_air_date;
    return date ? new Date(date).getFullYear().toString() : '';
  };

  const getContentRating = () => {
    return content?.adult ? '18+' : 'PG-13';
  };

  const getGenres = (): string[] => {
    return content?.genres?.map((g: any) => g.name) || [];
  };

  const getImdbRating = (): number => {
    if (ratings?.imdbRating && ratings.imdbRating !== 'N/A') {
      return parseFloat(ratings.imdbRating);
    }
    return content?.vote_average || 0;
  };

  const getRottenTomatoes = (): number | null => {
    if (ratings?.Ratings) {
      const rt = ratings.Ratings.find((r: any) => r.Source === 'Rotten Tomatoes');
      if (rt) {
        return parseInt(rt.Value);
      }
    }
    return null;
  };

  // Handlers
  const handleBack = () => {
    navigation.goBack();
  };

  const handleToggleBookmark = async () => {
    // Animate
    bookmarkScale.value = withSequence(
      withTiming(1.25, { duration: 100, easing: Easing.out(Easing.ease) }),
      withTiming(0.9, { duration: 80, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 120, easing: Easing.out(Easing.ease) })
    );

    const newState = !isBookmarked;
    setIsBookmarked(newState);

    try {
      if (newState) {
        await addToWatchlist(itemId, type, {
          title: content?.title || content?.name,
          posterPath: content?.poster_path,
          genreIds: content?.genres?.map((g: any) => g.id) || [],
          voteAverage: content?.vote_average,
        }, 'want_to_watch');
      } else {
        await removeFromWatchlist(itemId, type);
      }
    } catch (error) {
      console.error('[DetailScreen] Error toggling bookmark:', error);
      setIsBookmarked(!newState);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </View>
    );
  }

  // Error
  if (error || !content) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <Pressable onPress={handleBack} style={[styles.backButton, { top: insets.top + 16 }]}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text.primary }]}>
            Failed to load content
          </Text>
          <Pressable onPress={() => navigation.goBack()} style={[styles.retryButton, { backgroundColor: colors.accent.primary }]}>
            <Text style={styles.retryText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const imdbRating = getImdbRating();
  const rtScore = getRottenTomatoes();
  const genres = getGenres();

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <ImageSkeleton
            source={{ uri: getBackdropUrl() }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', `${colors.background.primary}33`, colors.background.primary]}
            locations={[0, 0.5, 1]}
            style={styles.heroGradient}
          />

          {/* Back Button */}
          <Pressable
            onPress={handleBack}
            style={[styles.backButton, { top: insets.top + 16 }]}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>

          {/* Bookmark Button */}
          <Animated.View style={[styles.bookmarkButton, { top: insets.top + 16 }, bookmarkAnimatedStyle]}>
            <Pressable
              onPress={handleToggleBookmark}
              style={[
                styles.bookmarkInner,
                { backgroundColor: isBookmarked ? colors.accent.primary : 'rgba(0,0,0,0.4)' },
              ]}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color="#FFFFFF"
              />
            </Pressable>
          </Animated.View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {content.title || content.name}
          </Text>

          {/* Year & Rating */}
          <Text style={[styles.meta, { color: colors.text.secondary }]}>
            {getYear()} <Text style={styles.dot}>·</Text> {getContentRating()}
          </Text>

          {/* Rating Badges */}
          <View style={styles.ratingRow}>
            {/* IMDb */}
            <View style={[styles.ratingBadge, { backgroundColor: colors.background.secondary }]}>
              <Ionicons name="star" size={14} color="#FACC15" />
              <Text style={[styles.ratingValue, { color: colors.text.primary }]}>
                {imdbRating.toFixed(1)}
              </Text>
              <Text style={[styles.ratingLabel, { color: colors.text.secondary }]}>IMDb</Text>
            </View>

            {/* Rotten Tomatoes */}
            {rtScore !== null && (
              <View style={[styles.ratingBadge, { backgroundColor: colors.background.secondary }]}>
                <Text style={styles.rtEmoji}>{rtScore >= 60 ? '🍅' : '🟢'}</Text>
                <Text style={[styles.ratingValue, { color: colors.text.primary }]}>
                  {rtScore}%
                </Text>
                <Text style={[styles.ratingLabel, { color: colors.text.secondary }]}>RT</Text>
              </View>
            )}
          </View>

          {/* Genre Tags */}
          {genres.length > 0 && (
            <View style={styles.genreRow}>
              {genres.slice(0, 4).map(genre => (
                <View
                  key={genre}
                  style={[styles.genreTag, { backgroundColor: colors.background.secondary }]}
                >
                  <Text style={[styles.genreText, { color: colors.text.secondary }]}>{genre}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          <Text style={[styles.description, { color: colors.text.primary }]}>
            {content.overview}
          </Text>

          {/* Available On */}
          {services.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Available on:
              </Text>
              <View style={styles.servicesRow}>
                {services.map(service => (
                  <View
                    key={service}
                    style={[styles.serviceChip, { backgroundColor: colors.background.secondary }]}
                  >
                    <ServiceBadge service={service} size="sm" />
                    <Text style={[styles.serviceLabel, { color: colors.text.primary }]}>
                      {SERVICE_LABELS[service] || service}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Cast</Text>
              <FlatList
                horizontal
                data={cast}
                keyExtractor={item => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.castList}
                renderItem={({ item }) => (
                  <View style={styles.castMember}>
                    <View style={[styles.castImage, { backgroundColor: colors.background.secondary }]}>
                      {item.profile_path ? (
                        <ImageSkeleton
                          source={{ uri: `https://image.tmdb.org/t/p/w185${item.profile_path}` }}
                          style={styles.castImageInner}
                          borderRadius={16}
                        />
                      ) : (
                        <Ionicons name="person" size={28} color={colors.text.tertiary} />
                      )}
                    </View>
                    <Text
                      style={[styles.castName, { color: colors.text.primary }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.castCharacter, { color: colors.text.secondary }]}
                      numberOfLines={1}
                    >
                      {item.character}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}

          {/* Spacer for bottom */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    aspectRatio: HERO_ASPECT_RATIO,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkButton: {
    position: 'absolute',
    right: 16,
  },
  bookmarkInner: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    marginTop: -16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 29,
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    marginBottom: 12,
  },
  dot: {
    marginHorizontal: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  ratingLabel: {
    fontSize: 11,
  },
  rtEmoji: {
    fontSize: 13,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  genreTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  genreText: {
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  serviceLabel: {
    fontSize: 13,
  },
  castList: {
    paddingRight: 16,
  },
  castMember: {
    width: 76,
    alignItems: 'center',
    marginRight: 12,
  },
  castImage: {
    width: 68,
    height: 68,
    borderRadius: 16,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  castImageInner: {
    width: '100%',
    height: '100%',
  },
  castName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  castCharacter: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default DetailScreen;
