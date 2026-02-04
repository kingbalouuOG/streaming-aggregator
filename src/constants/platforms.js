// UK Platform configurations with TMDb provider IDs
export const UK_PROVIDERS = {
  netflix: {
    id: 8,
    name: 'Netflix',
    color: '#E50914',
  },
  amazonPrime: {
    id: 9,
    name: 'Amazon Prime Video',
    color: '#00A8E1',
  },
  appleTv: {
    id: 350,
    name: 'Apple TV+',
    color: '#000000',
  },
  disneyPlus: {
    id: 337,
    name: 'Disney+',
    color: '#113CCF',
  },
  nowTV: {
    id: 39,
    name: 'Now TV',
    color: '#00E0FF',
  },
  bbcIplayer: {
    id: 38,
    name: 'BBC iPlayer',
    color: '#FF0000',
  },
  itvx: {
    id: 54,
    name: 'ITVX',
    color: '#000000',
  },
  channel4: {
    id: 103,
    name: 'Channel 4',
    color: '#0095D9',
  },
  paramount: {
    id: 582,
    name: 'Paramount+',
    color: '#0064FF',
  },
  skyGo: {
    id: 29,
    name: 'Sky Go',
    color: '#0072C9',
  },
};

// Convert to array for easier iteration
export const UK_PROVIDERS_ARRAY = Object.values(UK_PROVIDERS);

// Get provider by ID
export const getProviderById = (id) => {
  return UK_PROVIDERS_ARRAY.find(provider => provider.id === id);
};

// Mapping from rent/buy store IDs to their subscription platform equivalents
// TMDb uses different IDs for the same service's subscription vs rent/buy
export const RENT_BUY_TO_SUBSCRIPTION_MAP = {
  10: 9,    // Amazon Video (rent/buy) → Amazon Prime Video (subscription)
  2: 350,   // Apple TV (rent/buy store) → Apple TV+ (subscription)
  130: 39,  // Sky Store (rent/buy) → Now TV / Sky (subscription)
};

// Get the subscription platform ID for a rent/buy provider
// Returns the mapped subscription ID if available, otherwise returns the original ID
export const mapRentBuyToSubscription = (providerId) => {
  return RENT_BUY_TO_SUBSCRIPTION_MAP[providerId] || providerId;
};

// Check if a rent/buy provider maps to any of the user's subscription platforms
export const rentBuyMatchesUserPlatform = (rentBuyProviderId, userPlatformIds) => {
  const mappedId = mapRentBuyToSubscription(rentBuyProviderId);
  return userPlatformIds.includes(mappedId) || userPlatformIds.includes(rentBuyProviderId);
};

// Platform name normalization - maps variant names to canonical names
// This collapses service tiers (e.g., "Netflix Standard with Ads" -> "Netflix")
export const PLATFORM_NAME_VARIANTS = {
  // Netflix variants
  'Netflix Standard with Ads': 'Netflix',
  'Netflix basic with Ads': 'Netflix',
  'Netflix Basic with Ads': 'Netflix',
  'Netflix basic': 'Netflix',

  // Amazon variants
  'Amazon Prime Video with Ads': 'Amazon Prime Video',
  'Amazon Video': 'Amazon Prime Video',

  // Disney+ variants
  'Disney Plus': 'Disney+',
  'Disney+ Basic with Ads': 'Disney+',
  'Disney+ with Ads': 'Disney+',

  // Apple variants
  'Apple TV Plus': 'Apple TV+',
  'Apple iTunes': 'Apple TV+',
  'Apple TV': 'Apple TV+',

  // Paramount variants
  'Paramount+ with SHOWTIME': 'Paramount+',
  'Paramount Plus': 'Paramount+',
  'Paramount+ Amazon Channel': 'Paramount+',

  // Now TV variants (NOT Sky Go - that's a separate service with ID 29)
  'NOW': 'Now TV',

  // UK Free-to-air variants
  'ITVX Free': 'ITVX',
  'ITV Hub': 'ITVX',
  'Channel 4 Free': 'Channel 4',
  'All 4': 'Channel 4',
  'My5': 'Channel 5',
};

// Mapping from variant provider IDs to their canonical platform IDs
// TMDb sometimes returns different IDs for free tiers vs main service
export const PROVIDER_ID_VARIANTS = {
  // Channel 4 variants
  83: 103,   // All 4 → Channel 4
  1854: 103, // Channel 4 Free → Channel 4

  // ITVX variants
  41: 54,    // ITV Hub → ITVX
  2087: 54,  // ITVX Free → ITVX

  // BBC iPlayer (usually consistent, but just in case)
  // 38 is the canonical ID

  // Now TV variants
  591: 39,   // NOW → Now TV
};

// Get the canonical provider ID for a variant
export const mapProviderIdToCanonical = (providerId) => {
  return PROVIDER_ID_VARIANTS[providerId] || providerId;
};

// Function to normalize platform names to their canonical form
export const normalizePlatformName = (name) => {
  if (!name) return name;

  // Check exact match first
  if (PLATFORM_NAME_VARIANTS[name]) {
    return PLATFORM_NAME_VARIANTS[name];
  }

  // Check case-insensitive match
  const lowerName = name.toLowerCase();
  for (const [variant, canonical] of Object.entries(PLATFORM_NAME_VARIANTS)) {
    if (lowerName === variant.toLowerCase()) {
      return canonical;
    }
  }

  // Return original if no match
  return name;
};
