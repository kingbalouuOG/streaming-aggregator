import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={typography.h1}>Profile</Text>
      <Text style={typography.body}>Your preferences and settings</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
