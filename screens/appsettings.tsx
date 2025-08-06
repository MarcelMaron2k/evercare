// src/screens/AppSettings.tsx

import React, { useContext } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Switch,
  Pressable,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { SettingsContext, FontSizeKey } from '../context/SettingsContext';
import { useTheme } from '../utils/theme';

const { width } = Dimensions.get('window');
const FONT_SIZES: Record<FontSizeKey, number> = {
  small:  14,
  medium: 16,
  large:  18,
  xlarge: 20,
};

export default function AppSettings() {
  const { settings, updateSettings } = useContext(SettingsContext);
  const { colors, typography, backgroundImage } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        imageStyle={styles.bgImage}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.pageTitle,
              { fontSize: 24, fontWeight: '600', color: typography.textColor },
            ]}
          >
            App Settings
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {/* Dark Mode */}
          <View style={styles.row}>
            <Text
              style={[
                styles.label,
                { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor },
                settings.boldText && styles.boldText,
              ]}
            >
              Dark Mode
            </Text>
            <Switch
              value={settings.darkMode}
              onValueChange={v => updateSettings({ darkMode: v })}
            />
          </View>

          {/* Language */}
          <View style={styles.row}>
            <Text
              style={[
                styles.label,
                { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor },
                settings.boldText && styles.boldText,
              ]}
            >
              Language
            </Text>
            <View style={styles.rowInline}>
              {(['en','he'] as ('en'|'he')[]).map(lang => (
                <Pressable
                  key={lang}
                  style={[
                    styles.langButton,
                    { borderColor: colors.primary },
                    settings.language === lang && [styles.langButtonSelected, { backgroundColor: colors.primary + '20' }],
                  ]}
                  onPress={() => updateSettings({ language: lang })}
                >
                  <Text
                    style={[
                      styles.langText,
                      { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor },
                      settings.language === lang && styles.boldText,
                    ]}
                  >
                    {lang.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Font Size */}
          <View style={styles.section}>
            <Text
              style={[
                styles.label,
                { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor },
                settings.boldText && styles.boldText,
              ]}
            >
              Font Size
            </Text>
            <View style={styles.fontSizes}>
              {(['small','medium','large','xlarge'] as FontSizeKey[]).map(
                key => (
                  <Pressable
                    key={key}
                    onPress={() => updateSettings({ fontSizeKey: key })}
                    style={[
                      styles.fontButton,
                      { borderColor: colors.separator },
                      settings.fontSizeKey === key &&
                        [styles.fontButtonSelected, { backgroundColor: colors.primary + '20' }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.fontChar,
                        { fontSize: FONT_SIZES[key], fontWeight: typography.fontWeight, color: typography.textColor },
                        settings.boldText && styles.boldText,
                      ]}
                    >
                      A
                    </Text>
                  </Pressable>
                )
              )}
            </View>
          </View>

          {/* Bold Text */}
          <View style={styles.row}>
            <Text
              style={[
                styles.label,
                { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor },
                settings.boldText && styles.boldText,
              ]}
            >
              Bold Text
            </Text>
            <Switch
              value={settings.boldText}
              onValueChange={v => updateSettings({ boldText: v })}
            />
          </View>

          {/* High Contrast */}
          <View style={styles.row}>
            <Text
              style={[
                styles.label,
                { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor },
                settings.boldText && styles.boldText,
              ]}
            >
              High Contrast
            </Text>
            <Switch
              value={settings.highContrast}
              onValueChange={v => updateSettings({ highContrast: v })}
            />
          </View>

          {/* Appointment Reminders */}
          <View style={styles.row}>
            <Text
              style={[
                styles.label,
                { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor },
                settings.boldText && styles.boldText,
              ]}
            >
              Appointment Reminders
            </Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={v =>
                updateSettings({ notificationsEnabled: v })
              }
            />
          </View>

          {/* Medication Reminders */}
          <View style={styles.row}>
            <Text
              style={[
                styles.label,
                { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor },
                settings.boldText && styles.boldText,
              ]}
            >
              Medication Reminders
            </Text>
            <Switch
              value={settings.remindersEnabled}
              onValueChange={v => updateSettings({ remindersEnabled: v })}
            />
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const CARD_PADDING = 16;
const BUTTON_SIZE = (width - CARD_PADDING * 2 - 24) / 4;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  background: {
    flex: 1,
    width,
  },
  bgImage: {
    opacity: 0.6,
    resizeMode: 'cover',
  },
  header: {
    padding: CARD_PADDING,
    marginTop: CARD_PADDING,
  },
  pageTitle: {},
  container: {
    padding: CARD_PADDING,
    paddingBottom: CARD_PADDING * 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: CARD_PADDING,
  },
  rowInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    marginBottom: CARD_PADDING,
  },
  label: {},
  boldText: {
    fontWeight: '700',
  },
  langButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  langButtonSelected: {},
  langText: {
    fontSize: 16,
  },
  fontSizes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fontButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    borderWidth: 1,
  },
  fontButtonSelected: {},
  fontChar: {},
});
