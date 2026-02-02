/**
 * EditableField Component
 * Inline editable field with view/edit modes
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, layout } from '../theme';
import GlassContainer from './GlassContainer';

const EditableField = ({
  label,
  value,
  onSave,
  validator,
  keyboardType = 'default',
  autoCapitalize = 'none',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setEditValue(value);
    setError('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value);
    setError('');
    setIsEditing(false);
  };

  const handleSave = () => {
    if (validator) {
      const validation = validator(editValue);
      if (!validation.valid) {
        setError(validation.error || 'Invalid value');
        return;
      }
    }

    onSave(editValue.trim());
    setError('');
    setIsEditing(false);
  };

  const handleChange = (text) => {
    setEditValue(text);
    if (error && validator) {
      const validation = validator(text);
      if (validation.valid) {
        setError('');
      }
    }
  };

  return (
    <View style={styles.container}>
      <GlassContainer
        style={styles.fieldContainer}
        borderRadius={layout.borderRadius.medium}
      >
        <Text style={[typography.metadata, styles.label]}>{label}</Text>

        {isEditing ? (
          <View style={styles.editRow}>
            <TextInput
              ref={inputRef}
              style={[typography.body, styles.input]}
              value={editValue}
              onChangeText={handleChange}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              selectTextOnFocus
            />
            <View style={styles.actions}>
              <Pressable
                style={styles.actionButton}
                onPress={handleCancel}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={colors.text.secondary} />
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={handleSave}
                hitSlop={8}
              >
                <Ionicons name="checkmark" size={20} color={colors.accent.primary} />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.displayRow} onPress={handleEdit}>
            <Text style={[typography.body, styles.value]} numberOfLines={1}>
              {value || 'Not set'}
            </Text>
            <Ionicons name="pencil" size={18} color={colors.text.tertiary} />
          </Pressable>
        )}
      </GlassContainer>

      {error ? (
        <Text style={[typography.metadata, styles.errorText]}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  fieldContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  label: {
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    minHeight: 24,
    padding: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorText: {
    color: colors.accent.error,
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
  },
});

export default EditableField;
