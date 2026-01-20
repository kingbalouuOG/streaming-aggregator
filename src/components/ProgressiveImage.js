/**
 * ProgressiveImage Component
 * Loads images with blur-to-sharp effect for better perceived performance
 */

import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme';

const ProgressiveImage = ({
  source,
  style,
  resizeMode = 'cover',
  blurRadius = 10,
  thumbnailSource,
  onLoadEnd,
}) => {
  const [imageOpacity] = useState(new Animated.Value(0));
  const [thumbnailOpacity] = useState(new Animated.Value(1));
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup animations on unmount
      imageOpacity.stopAnimation();
      thumbnailOpacity.stopAnimation();
    };
  }, []);

  const handleImageLoad = () => {
    setHasLoaded(true);

    // Fade in the full image
    Animated.parallel([
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(thumbnailOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onLoadEnd) onLoadEnd();
    });
  };

  return (
    <View style={style}>
      {/* Thumbnail/Blurred placeholder */}
      {thumbnailSource && (
        <Animated.Image
          source={thumbnailSource}
          style={[
            StyleSheet.absoluteFill,
            styles.image,
            { opacity: thumbnailOpacity },
          ]}
          resizeMode={resizeMode}
          blurRadius={blurRadius}
        />
      )}

      {/* Placeholder background */}
      {!thumbnailSource && !hasLoaded && (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
      )}

      {/* Full resolution image */}
      <Animated.Image
        source={source}
        style={[
          StyleSheet.absoluteFill,
          styles.image,
          { opacity: imageOpacity },
        ]}
        resizeMode={resizeMode}
        onLoad={handleImageLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.background.tertiary,
  },
});

export default ProgressiveImage;
