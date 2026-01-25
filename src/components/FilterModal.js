/**
 * FilterModal Component
 * Comprehensive filter modal with all filter sections
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, layout } from '../theme';
import { UK_PROVIDERS_ARRAY, getProviderById } from '../constants/platforms';
import ServiceCard from './ServiceCard';
import FilterChip from './FilterChip';
import FilterSwitch from './FilterSwitch';
import RatingSlider from './RatingSlider';

// Content type options
const CONTENT_TYPES = [
  { key: 'all', label: 'All' },
  { key: 'movies', label: 'Movies' },
  { key: 'tv', label: 'TV' },
  { key: 'documentaries', label: 'Docs' },
];

// Cost filter options
const COST_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'free', label: 'Free' },
  { key: 'paid', label: 'Paid' },
];

// Genre list for filter
const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

const FilterModal = ({
  visible,
  onClose,
  filters,
  onApply,
  onClear,
  userPlatforms = [],
}) => {
  const insets = useSafeAreaInsets();

  // Local state for draft filter changes
  const [draftFilters, setDraftFilters] = useState(filters);

  // Reset draft when modal opens
  useEffect(() => {
    if (visible) {
      setDraftFilters(filters);
    }
  }, [visible, filters]);

  // Get platform info for user's selected platforms
  const userPlatformDetails = userPlatforms
    .map((id) => getProviderById(id))
    .filter(Boolean);

  // Update handlers
  const toggleService = (platformId) => {
    setDraftFilters((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(platformId)
        ? prev.selectedServices.filter((id) => id !== platformId)
        : [...prev.selectedServices, platformId],
    }));
  };

  const setContentType = (type) => {
    setDraftFilters((prev) => ({ ...prev, contentType: type }));
  };

  const setCostFilter = (cost) => {
    setDraftFilters((prev) => ({ ...prev, costFilter: cost }));
  };

  const toggleGenre = (genreId) => {
    setDraftFilters((prev) => ({
      ...prev,
      selectedGenres: prev.selectedGenres.includes(genreId)
        ? prev.selectedGenres.filter((id) => id !== genreId)
        : [...prev.selectedGenres, genreId],
    }));
  };

  const setMinRating = (rating) => {
    setDraftFilters((prev) => ({ ...prev, minRating: rating }));
  };

  const handleApply = () => {
    onApply(draftFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {
      selectedServices: [],
      contentType: 'all',
      costFilter: 'all',
      selectedGenres: [],
      minRating: 0,
    };
    setDraftFilters(clearedFilters);
    onClear();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[typography.h3, styles.title]}>Filters</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {/* Section 1: Streaming Services */}
            {userPlatformDetails.length > 0 && (
              <View style={styles.section}>
                <Text style={[typography.caption, styles.sectionLabel]}>
                  STREAMING SERVICES
                </Text>
                <View style={styles.servicesGrid}>
                  {userPlatformDetails.map((platform) => (
                    <ServiceCard
                      key={platform.id}
                      platformId={platform.id}
                      name={platform.name}
                      color={platform.color}
                      selected={draftFilters.selectedServices.includes(platform.id)}
                      onPress={() => toggleService(platform.id)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Section 2: Content Type */}
            <View style={styles.section}>
              <Text style={[typography.caption, styles.sectionLabel]}>
                CONTENT TYPE
              </Text>
              <View style={styles.chipRow}>
                {CONTENT_TYPES.map((type) => (
                  <FilterChip
                    key={type.key}
                    label={type.label}
                    active={draftFilters.contentType === type.key}
                    onPress={() => setContentType(type.key)}
                  />
                ))}
              </View>
            </View>

            {/* Section 3: Cost */}
            <View style={styles.section}>
              <Text style={[typography.caption, styles.sectionLabel]}>
                COST
              </Text>
              <FilterSwitch
                options={COST_OPTIONS}
                selectedKey={draftFilters.costFilter}
                onSelect={setCostFilter}
              />
            </View>

            {/* Section 4: Genre */}
            <View style={styles.section}>
              <Text style={[typography.caption, styles.sectionLabel]}>
                GENRE
              </Text>
              <View style={styles.genreGrid}>
                {GENRES.map((genre) => (
                  <Pressable
                    key={genre.id}
                    style={[
                      styles.genreChip,
                      draftFilters.selectedGenres.includes(genre.id) && styles.genreChipSelected,
                    ]}
                    onPress={() => toggleGenre(genre.id)}
                  >
                    <Text
                      style={[
                        styles.genreChipText,
                        draftFilters.selectedGenres.includes(genre.id) && styles.genreChipTextSelected,
                      ]}
                    >
                      {genre.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Section 5: Rating */}
            <View style={styles.section}>
              <Text style={[typography.caption, styles.sectionLabel]}>
                MINIMUM RATING
              </Text>
              <RatingSlider
                value={draftFilters.minRating}
                onChange={setMinRating}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </Pressable>
            <Pressable style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  title: {
    color: colors.text.primary,
  },
  scrollContent: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.text.tertiary,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  genreChipSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  genreChipText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  genreChipTextSelected: {
    color: colors.text.inverse,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glass.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: layout.borderRadius.medium,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: layout.borderRadius.medium,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  applyButtonText: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
});

export default FilterModal;
