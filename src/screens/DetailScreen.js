import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Pressable,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, layout } from '../theme';
import { getMovieDetails, getTVDetails } from '../api/tmdb';
import { getRatings } from '../api/omdb';
import GlassContainer from '../components/GlassContainer';
import RatingBadge from '../components/RatingBadge';
import PlatformChip from '../components/PlatformChip';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DetailScreen = ({ route, navigation }) => {
  const { itemId, type } = route.params || {};

  const [content, setContent] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContentDetails();
  }, [itemId, type]);

  const loadContentDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch TMDb details with additional data
      let tmdbResponse;
      if (type === 'movie') {
        tmdbResponse = await getMovieDetails(itemId, {
          append_to_response: 'credits,watch/providers,external_ids',
        });
      } else {
        tmdbResponse = await getTVDetails(itemId, {
          append_to_response: 'credits,watch/providers,external_ids',
        });
      }

      if (tmdbResponse.success) {
        setContent(tmdbResponse.data);

        // Fetch OMDB ratings if IMDb ID is available
        const imdbId = tmdbResponse.data.external_ids?.imdb_id;
        if (imdbId) {
          const ratingsResponse = await getRatings(imdbId, type);
          if (ratingsResponse.success) {
            setRatings(ratingsResponse.data);
          }
        }
      }
    } catch (error) {
      console.error('[DetailScreen] Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBackdropUrl = (path) => {
    return path ? `https://image.tmdb.org/t/p/w1280${path}` : null;
  };

  const getPosterUrl = (path) => {
    return path ? `https://image.tmdb.org/t/p/w500${path}` : null;
  };

  const getYear = () => {
    if (!content) return '';
    const date = content.release_date || content.first_air_date;
    return date ? new Date(date).getFullYear() : '';
  };

  const getRuntime = () => {
    if (!content) return '';
    if (type === 'movie' && content.runtime) {
      const hours = Math.floor(content.runtime / 60);
      const minutes = content.runtime % 60;
      return `${hours}h ${minutes}m`;
    }
    if (type === 'tv' && content.episode_run_time?.length > 0) {
      return `${content.episode_run_time[0]}m`;
    }
    return '';
  };

  const getContentRating = () => {
    if (!content) return '';
    // Movie: content_rating from releases, TV: content_rating from content_ratings
    // For simplicity, we'll show the certification if available
    return content.adult ? '18+' : 'PG';
  };

  const getUKPlatforms = () => {
    if (!content || !content['watch/providers']?.results?.GB) return [];

    const providers = content['watch/providers'].results.GB;
    const flatrate = providers.flatrate || [];

    return flatrate.map((provider) => ({
      id: provider.provider_id,
      name: provider.provider_name,
      logo: provider.logo_path,
    }));
  };

  const getCast = () => {
    if (!content?.credits?.cast) return [];
    return content.credits.cast.slice(0, 10);
  };

  const renderCastMember = ({ item }) => (
    <View style={styles.castCard}>
      {item.profile_path ? (
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w185${item.profile_path}` }}
          style={styles.castPhoto}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.castPhoto, styles.castPhotoPlaceholder]}>
          <Ionicons name="person" size={32} color={colors.text.tertiary} />
        </View>
      )}
      <Text style={[typography.caption, styles.castName]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={[typography.metadata, styles.castCharacter]} numberOfLines={2}>
        {item.character}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={[typography.body, styles.loadingText]}>
          Loading details...
        </Text>
      </View>
    );
  }

  if (!content) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[typography.h3, styles.errorText]}>
          Failed to load content
        </Text>
      </View>
    );
  }

  const backdropUrl = getBackdropUrl(content.backdrop_path);
  const posterUrl = getPosterUrl(content.poster_path);
  const title = content.title || content.name;
  const overview = content.overview;
  const ukPlatforms = getUKPlatforms();
  const cast = getCast();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Backdrop with Gradient */}
      <View style={styles.backdropContainer}>
        {backdropUrl ? (
          <Image
            source={{ uri: backdropUrl }}
            style={styles.backdrop}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.backdrop, styles.backdropPlaceholder]} />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
          style={styles.backdropGradient}
        />

        {/* Back Button */}
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <GlassContainer
            style={styles.backButtonInner}
            borderRadius={layout.borderRadius.circle}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </GlassContainer>
        </Pressable>
      </View>

      {/* Content Info */}
      <View style={styles.contentSection}>
        {/* Poster */}
        <View style={styles.posterContainer}>
          {posterUrl ? (
            <Image
              source={{ uri: posterUrl }}
              style={styles.poster}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.poster, styles.posterPlaceholder]}>
              <Ionicons name="film" size={48} color={colors.text.tertiary} />
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <Text style={[typography.h1, styles.title]}>{title}</Text>

          {/* Metadata Row */}
          <View style={styles.metadataRow}>
            {getYear() && (
              <Text style={[typography.caption, styles.metadata]}>
                {getYear()}
              </Text>
            )}
            {getRuntime() && (
              <>
                <Text style={[typography.caption, styles.metadata]}>•</Text>
                <Text style={[typography.caption, styles.metadata]}>
                  {getRuntime()}
                </Text>
              </>
            )}
            {getContentRating() && (
              <>
                <Text style={[typography.caption, styles.metadata]}>•</Text>
                <Text style={[typography.caption, styles.metadata]}>
                  {getContentRating()}
                </Text>
              </>
            )}
          </View>

          {/* Rating Badges */}
          <View style={styles.ratingsRow}>
            {ratings?.rottenTomatoes && (
              <RatingBadge type="rt" score={ratings.rottenTomatoes} />
            )}
            {ratings?.imdbRating && (
              <RatingBadge type="imdb" score={ratings.imdbRating} />
            )}
          </View>

          {/* Synopsis */}
          {overview && (
            <View style={styles.synopsisSection}>
              <Text style={[typography.body, styles.synopsis]}>{overview}</Text>
            </View>
          )}

          {/* Available On */}
          {ukPlatforms.length > 0 && (
            <View style={styles.platformsSection}>
              <Text style={[typography.h4, styles.platformsLabel]}>
                Available on:
              </Text>
              <View style={styles.platformsChips}>
                {ukPlatforms.map((platform) => (
                  <PlatformChip key={platform.id} name={platform.name} />
                ))}
              </View>
            </View>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <View style={styles.castSection}>
              <Text style={[typography.h4, styles.sectionLabel]}>Cast</Text>
              <FlatList
                horizontal
                data={cast}
                renderItem={renderCastMember}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.castList}
              />
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  backdropContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.6,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  backdropPlaceholder: {
    backgroundColor: colors.background.tertiary,
  },
  backdropGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    zIndex: 10,
  },
  backButtonInner: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSection: {
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.xxxl,
  },
  posterContainer: {
    marginBottom: spacing.lg,
  },
  poster: {
    width: 150,
    aspectRatio: 2 / 3,
    borderRadius: layout.borderRadius.medium,
    backgroundColor: colors.background.tertiary,
  },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
  },
  title: {
    marginBottom: spacing.sm,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metadata: {
    color: colors.text.secondary,
  },
  ratingsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  synopsisSection: {
    marginBottom: spacing.xl,
  },
  synopsis: {
    color: colors.text.secondary,
    lineHeight: 24,
  },
  platformsSection: {
    marginBottom: spacing.xl,
  },
  platformsLabel: {
    marginBottom: spacing.md,
  },
  platformsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  castSection: {
    marginBottom: spacing.xxxl,
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  castList: {
    paddingRight: spacing.lg,
  },
  castCard: {
    width: 100,
    marginRight: spacing.md,
  },
  castPhoto: {
    width: 100,
    height: 100,
    borderRadius: layout.borderRadius.medium,
    backgroundColor: colors.background.tertiary,
    marginBottom: spacing.sm,
  },
  castPhotoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  castName: {
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  castCharacter: {
    color: colors.text.tertiary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
  errorText: {
    color: colors.text.secondary,
  },
});

export default DetailScreen;
