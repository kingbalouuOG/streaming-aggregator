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
