# Theme System Documentation

## Overview

The theme system provides a complete design token library based on DESIGN_SYSTEM.md specifications. All values are production-ready and consistent across the app.

## Installation

Import theme tokens from a single location:

```javascript
import { colors, typography, spacing, animations } from './src/theme';
```

Or import specific modules:

```javascript
import colors from './src/theme/colors';
import typography from './src/theme/typography';
```

---

## Colors (`src/theme/colors.js`)

### Background Colors

```javascript
import { colors } from './src/theme';

// Pure black for OLED
colors.background.primary    // '#000000'

// Elevated surfaces
colors.background.secondary  // '#121212'

// Cards and containers
colors.background.tertiary   // '#1E1E1E'

// Glass morphism overlay
colors.background.glass      // 'rgba(255, 255, 255, 0.05)'
```

**Usage:**
```javascript
<View style={{ backgroundColor: colors.background.primary }}>
  {/* Content */}
</View>
```

---

### Text Colors

```javascript
// Main headings, important text
colors.text.primary      // '#FFFFFF'

// Body text, metadata
colors.text.secondary    // '#B3B3B3'

// Hints, disabled states
colors.text.tertiary     // '#666666'

// Text on light backgrounds
colors.text.inverse      // '#000000'
```

**Usage:**
```javascript
<Text style={{ color: colors.text.primary }}>
  Heading Text
</Text>

<Text style={{ color: colors.text.secondary }}>
  Body text
</Text>
```

---

### Accent Colors

```javascript
// Primary actions, highlights (Netflix red)
colors.accent.primary     // '#FF375F'

// Links, secondary actions (Bright cyan)
colors.accent.secondary   // '#00D9FF'

// Confirmations (Apple green)
colors.accent.success     // '#30D158'

// Alerts (Amber)
colors.accent.warning     // '#FFD60A'

// Errors (Red)
colors.accent.error       // '#FF453A'
```

**Usage:**
```javascript
<Button
  style={{ backgroundColor: colors.accent.primary }}
  title="Continue"
/>

<Text style={{ color: colors.accent.secondary }}>
  Learn More →
</Text>
```

---

### Glass Effects

```javascript
colors.glass.light    // 'rgba(255, 255, 255, 0.1)'
colors.glass.medium   // 'rgba(255, 255, 255, 0.15)'
colors.glass.heavy    // 'rgba(255, 255, 255, 0.2)'
colors.glass.border   // 'rgba(255, 255, 255, 0.15)'
```

**Usage:**
```javascript
<View style={{
  backgroundColor: colors.glass.light,
  borderWidth: 1,
  borderColor: colors.glass.border,
}}>
  {/* Glass effect container */}
</View>
```

---

### Overlays

```javascript
colors.overlay.light   // 'rgba(0, 0, 0, 0.3)'
colors.overlay.medium  // 'rgba(0, 0, 0, 0.6)'
colors.overlay.heavy   // 'rgba(0, 0, 0, 0.85)'
```

**Usage:**
```javascript
<View style={{
  ...StyleSheet.absoluteFillObject,
  backgroundColor: colors.overlay.medium,
}}>
  {/* Backdrop overlay */}
</View>
```

---

### Platform Colors

```javascript
colors.platforms.netflix    // '#E50914'
colors.platforms.amazon     // '#00A8E1'
colors.platforms.apple      // '#000000'
colors.platforms.disney     // '#113CCF'
// ... etc
```

---

## Typography (`src/theme/typography.js`)

### Type Scale

```javascript
import { typography } from './src/theme';

// Headings
typography.h1  // 34px, bold
typography.h2  // 28px, bold
typography.h3  // 22px, semibold
typography.h4  // 20px, semibold

// Body
typography.body       // 17px, regular
typography.bodyBold   // 17px, semibold

// UI
typography.button     // 17px, semibold
typography.caption    // 15px, regular
typography.captionBold // 15px, semibold
typography.metadata   // 13px, regular
```

**All styles include:**
- `fontSize`
- `fontWeight`
- `lineHeight`
- `letterSpacing`
- `color`

**Usage:**
```javascript
<Text style={typography.h1}>
  StreamFinder
</Text>

<Text style={typography.body}>
  Browse content from multiple platforms
</Text>

<Text style={typography.metadata}>
  2024 • 8.5/10 • 2h 19m
</Text>
```

---

### Font Families

```javascript
import { fonts } from './src/theme';

fonts.ios       // 'SF Pro Display'
fonts.android   // 'Roboto'
fonts.current   // Platform-specific (auto-detected)
```

---

### Font Weights

```javascript
import { fontWeights } from './src/theme';

fontWeights.regular   // '400'
fontWeights.medium    // '500'
fontWeights.semibold  // '600'
fontWeights.bold      // '700'
```

---

## Spacing (`src/theme/spacing.js`)

### Spacing Scale (Base: 4px)

```javascript
import { spacing } from './src/theme';

spacing.xs     // 4px  - Tight spacing, icon padding
spacing.sm     // 8px  - Small gaps, chip padding
spacing.md     // 12px - Default spacing between elements
spacing.lg     // 16px - Section spacing, card padding
spacing.xl     // 24px - Large gaps, screen padding
spacing.xxl    // 32px - Section headers, major spacing
spacing.xxxl   // 48px - Screen top/bottom padding
```

**Usage:**
```javascript
<View style={{
  padding: spacing.lg,
  marginBottom: spacing.xl,
  gap: spacing.md,
}}>
  {/* Content */}
</View>
```

---

### Layout Constants

```javascript
import { layout } from './src/theme';

layout.screenPadding    // 16px - Screen horizontal padding
layout.cardPadding      // 16px - Card internal padding
layout.sectionSpacing   // 24px - Between sections
layout.gridGap          // 12px - 2-column grid gap

// Border radius
layout.borderRadius.small   // 6
layout.borderRadius.medium  // 12
layout.borderRadius.large   // 16
layout.borderRadius.pill    // 20
layout.borderRadius.circle  // 999
```

**Usage:**
```javascript
<View style={{
  paddingHorizontal: layout.screenPadding,
  borderRadius: layout.borderRadius.medium,
}}>
  {/* Content */}
</View>
```

---

## Animations (`src/theme/animations.js`)

### Easing Curves

```javascript
import { easing } from './src/theme';

easing.standard    // Bezier(0.4, 0.0, 0.2, 1) - Most animations
easing.decelerate  // Bezier(0.0, 0.0, 0.2, 1) - Items entering
easing.accelerate  // Bezier(0.4, 0.0, 1, 1)   - Items exiting
easing.sharp       // Bezier(0.4, 0.0, 0.6, 1) - Quick transitions
```

---

### Durations

```javascript
import { duration } from './src/theme';

duration.fast    // 150ms - Quick feedback
duration.normal  // 250ms - Standard transitions
duration.slow    // 350ms - Deliberate animations
```

---

### Spring Config

```javascript
import { spring } from './src/theme';

spring.standard  // tension: 100, friction: 7
spring.bouncy    // tension: 200, friction: 10
spring.gentle    // tension: 50, friction: 7
```

**Usage:**
```javascript
import { Animated } from 'react-native';
import { spring } from './src/theme';

Animated.spring(animatedValue, {
  toValue: 1,
  ...spring.standard,
}).start();
```

---

### Timing Config

```javascript
import { timing } from './src/theme';

timing.fast      // 150ms, standard easing
timing.normal    // 250ms, standard easing
timing.slow      // 350ms, standard easing
timing.fadeIn    // 250ms, decelerate easing
timing.fadeOut   // 150ms, accelerate easing
```

**Usage:**
```javascript
import { Animated } from 'react-native';
import { timing } from './src/theme';

Animated.timing(opacity, {
  toValue: 1,
  ...timing.fadeIn,
}).start();
```

---

### Animation Presets

```javascript
import { animations } from './src/theme';

// Card press
animations.cardPress
// { scale: 0.95, opacity: 0.8, duration: 150 }

// Button press
animations.buttonPress
// { scale: 0.98, opacity: 0.8, duration: 150 }

// Fade in
animations.fadeIn
// { from: { opacity: 0 }, to: { opacity: 1 }, duration: 250 }

// Fade out
animations.fadeOut
// { from: { opacity: 1 }, to: { opacity: 0 }, duration: 150 }

// Slide in from bottom
animations.slideInBottom
// { from: { translateY: 50, opacity: 0 }, to: { translateY: 0, opacity: 1 } }

// Slide out to bottom
animations.slideOutBottom
// { from: { translateY: 0, opacity: 1 }, to: { translateY: 50, opacity: 0 } }
```

---

## GlassContainer Component

Platform-specific glass morphism component.

### Props

```typescript
interface GlassContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;        // Blur intensity (iOS only) - default: 80
  tint?: 'light' | 'dark';   // Blur tint (iOS only) - default: 'dark'
  borderRadius?: number;     // Border radius - default: 12
  borderWidth?: number;      // Border width - default: 1
}
```

### Usage

```javascript
import GlassContainer from './src/components/GlassContainer';

<GlassContainer
  style={{ padding: 16 }}
  intensity={80}
  tint="dark"
  borderRadius={12}
>
  <Text>Glass effect content</Text>
</GlassContainer>
```

### Platform Behavior

**iOS:**
- Uses `BlurView` from expo-blur
- True glass morphism with backdrop blur
- Adjustable intensity and tint

**Android:**
- Uses semi-transparent background
- Consistent visual appearance
- No backdrop blur (not supported)

---

## Complete Usage Examples

### Screen Layout

```javascript
import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { colors, typography, spacing, layout } from './src/theme';

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={typography.h1}>StreamFinder</Text>
        <Text style={[typography.body, styles.subtitle]}>
          Browse content from multiple platforms
        </Text>
        {/* Content */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.md,
  },
});
```

---

### Card Component

```javascript
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, spacing, layout } from './src/theme';

const MovieCard = ({ movie }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: movie.posterUrl }} style={styles.poster} />
      <Text style={[typography.caption, styles.title]} numberOfLines={2}>
        {movie.title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.tertiary,
    borderRadius: layout.borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
  },
  title: {
    padding: spacing.md,
    color: colors.text.primary,
  },
});
```

---

### Button Component

```javascript
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, layout } from './src/theme';

const PrimaryButton = ({ title, onPress }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <Text style={typography.button}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    backgroundColor: colors.accent.primary,
    borderRadius: layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
```

---

### Animated Card Press

```javascript
import React, { useRef } from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';
import { animations } from './src/theme';

const AnimatedCard = ({ children, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: animations.cardPress.scale,
      ...spring.standard,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      ...spring.standard,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    // Card styles
  },
});
```

---

## Best Practices

### 1. Always Use Theme Tokens

```javascript
// ❌ Don't hardcode colors
<View style={{ backgroundColor: '#000000' }}>

// ✅ Use theme colors
<View style={{ backgroundColor: colors.background.primary }}>
```

### 2. Use Consistent Spacing

```javascript
// ❌ Don't use arbitrary values
<View style={{ padding: 14, marginBottom: 21 }}>

// ✅ Use theme spacing
<View style={{ padding: spacing.lg, marginBottom: spacing.xl }}>
```

### 3. Apply Typography Styles

```javascript
// ❌ Don't define typography inline
<Text style={{ fontSize: 34, fontWeight: '700', color: '#FFF' }}>

// ✅ Use typography tokens
<Text style={typography.h1}>
```

### 4. Combine Styles Properly

```javascript
// ✅ Merge theme styles with custom styles
<Text style={[typography.body, { textAlign: 'center' }]}>
  Centered body text
</Text>
```

---

## Summary

✅ **Complete color palette** - Backgrounds, text, accents, glass, overlays
✅ **Type scale** - h1-h4, body, button, caption, metadata
✅ **Spacing system** - xs to xxxl (4px base)
✅ **Animation presets** - Easing, durations, spring configs
✅ **GlassContainer** - Platform-specific glass morphism
✅ **Single import** - Import all tokens from one location
✅ **Production ready** - All values from DESIGN_SYSTEM.md

The theme system is ready for production use! 🎨
