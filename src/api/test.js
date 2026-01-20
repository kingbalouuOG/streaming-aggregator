/**
 * API Client Test File
 *
 * This file contains test functions to verify API clients are working.
 * Run these tests to ensure your API keys are configured correctly.
 */

import { getConfiguration, discoverMovies, getMovieDetails } from './tmdb';
import { getRatings } from './omdb';

// Test TMDb Configuration
export const testTMDbConfiguration = async () => {
  console.log('\n=== Testing TMDb Configuration ===');
  const result = await getConfiguration();

  if (result.success) {
    console.log('✅ TMDb Configuration successful');
    console.log('Image base URL:', result.data.images.base_url);
    return true;
  } else {
    console.error('❌ TMDb Configuration failed:', result.error);
    return false;
  }
};

// Test TMDb Discover Movies
export const testTMDbDiscoverMovies = async () => {
  console.log('\n=== Testing TMDb Discover Movies ===');
  const result = await discoverMovies({
    with_watch_providers: '8', // Netflix
    page: 1,
  });

  if (result.success) {
    console.log('✅ TMDb Discover Movies successful');
    console.log(`Found ${result.data.results.length} movies`);
    if (result.data.results.length > 0) {
      console.log('First movie:', result.data.results[0].title);
    }
    return true;
  } else {
    console.error('❌ TMDb Discover Movies failed:', result.error);
    return false;
  }
};

// Test TMDb Movie Details
export const testTMDbMovieDetails = async () => {
  console.log('\n=== Testing TMDb Movie Details ===');
  const result = await getMovieDetails(550); // Fight Club

  if (result.success) {
    console.log('✅ TMDb Movie Details successful');
    console.log('Movie:', result.data.title);
    console.log('IMDb ID:', result.data.external_ids?.imdb_id);
    return result.data.external_ids?.imdb_id || null;
  } else {
    console.error('❌ TMDb Movie Details failed:', result.error);
    return null;
  }
};

// Test OMDB Ratings
export const testOMDbRatings = async (imdbId = 'tt0137523') => {
  console.log('\n=== Testing OMDB Ratings ===');
  console.log('IMDb ID:', imdbId);

  const result = await getRatings(imdbId, 'movie');

  if (result.success) {
    console.log('✅ OMDB Ratings successful');
    console.log('IMDb Rating:', result.data.imdbRating);
    console.log('Rotten Tomatoes:', result.data.rottenTomatoes ? `${result.data.rottenTomatoes}%` : 'N/A');
    return true;
  } else {
    console.error('❌ OMDB Ratings failed:', result.error);
    return false;
  }
};

// Run all tests
export const runAllTests = async () => {
  console.log('\n🧪 Starting API Client Tests...\n');

  // Test TMDb
  const configOk = await testTMDbConfiguration();
  const discoverOk = await testTMDbDiscoverMovies();
  const imdbId = await testTMDbMovieDetails();

  // Test OMDB
  const ratingsOk = await testOMDbRatings(imdbId || 'tt0137523');

  // Summary
  console.log('\n=== Test Summary ===');
  console.log('TMDb Configuration:', configOk ? '✅' : '❌');
  console.log('TMDb Discover Movies:', discoverOk ? '✅' : '❌');
  console.log('TMDb Movie Details:', imdbId ? '✅' : '❌');
  console.log('OMDB Ratings:', ratingsOk ? '✅' : '❌');

  const allPassed = configOk && discoverOk && imdbId && ratingsOk;
  console.log('\n' + (allPassed ? '✅ All tests passed!' : '❌ Some tests failed'));

  return allPassed;
};

// Export individual test functions
export default {
  testTMDbConfiguration,
  testTMDbDiscoverMovies,
  testTMDbMovieDetails,
  testOMDbRatings,
  runAllTests,
};
