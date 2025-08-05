// src/components/ActionCard.tsx

import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import Colors from '../../styles/Colors';

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
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex:            1,
    margin:          8,
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.blue + '20',
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
    fontSize:   16,
    fontWeight: '600',
    color:      Colors.blue,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color:    Colors.gray,
  },
});
