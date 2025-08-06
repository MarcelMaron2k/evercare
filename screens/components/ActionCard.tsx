// src/components/ActionCard.tsx

import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/theme';

export default function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors, typography } = useTheme();

  return (
    <Pressable style={[styles.card, { backgroundColor: colors.card }]} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.primary, fontSize: typography.fontSize, fontWeight: typography.fontWeight }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.fontSize - 2 }]}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex:            1,
    margin:          8,
    borderRadius:    8,
    padding:         16,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOpacity:   0.05,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  iconContainer: {
    borderRadius:    24,
    padding:         12,
    marginBottom:    8,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    // Dynamic styles applied inline
  },
});
