import { useColorScheme, Appearance } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { SettingsContext, type FontSizeKey } from '../context/SettingsContext';

export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const settingsContext = useContext(SettingsContext);
  const [currentColorScheme, setCurrentColorScheme] = useState(systemColorScheme);
  
  
  if (!settingsContext) {
    throw new Error('useTheme must be used within a SettingsProvider');
  }
  
  const { settings } = settingsContext;
  
  // Use Appearance.getColorScheme() as fallback and listen for changes
  useEffect(() => {
    // Get initial color scheme from Appearance API
    const appearanceColorScheme = Appearance.getColorScheme();
    
    // Use the more reliable value
    const initialScheme = appearanceColorScheme || systemColorScheme;
    setCurrentColorScheme(initialScheme);
    
    // Listen for appearance changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setCurrentColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, [systemColorScheme]);
  
  // Respect user's manual dark mode setting over system setting
  const isDark = currentColorScheme === 'dark' || settings.darkMode;

  const colors = {
    // Background colors
    background: isDark ? '#000000' : '#f9f9f9',
    card: isDark ? '#1c1c1e' : '#ffffff',
    surface: isDark ? '#2c2c2e' : '#ffffff',
    
    // Text colors
    text: isDark ? '#d1d1d6' : '#000000',           // Slightly grey in dark mode
    textSecondary: isDark ? '#8e8e93' : '#666666',
    textTertiary: isDark ? '#636366' : '#333333',
    
    // UI colors
    primary: '#007AFF',
    danger: '#FF3B30',
    destructive: '#FF3B30',
    warning: '#d32f2f',
    success: '#34C759',
    
    // Border colors
    border: isDark ? '#38383a' : '#e0e0e0',
    separator: isDark ? '#38383a' : '#c0c0c0',
    
    // Shadow colors (for elevation)
    shadow: isDark ? '#ffffff' : '#000000',
  };

  // Font size mapping from settings
  const FONT_SIZES: Record<FontSizeKey, number> = {
    small: 14,
    medium: 16,
    large: 18,
    xlarge: 20,
  };

  // Typography based on user settings
  const typography = {
    fontSize: FONT_SIZES[settings.fontSizeKey],
    fontWeight: settings.boldText ? '700' as const : '400' as const,
    textColor: settings.highContrast 
      ? (isDark ? '#ffffff' : '#000000') // Pure white for dark mode high contrast, black for light mode
      : isDark 
        ? colors.text                    // Slightly grey (#d1d1d6) for regular dark mode
        : colors.primary,
  };

  // Background assets
  const backgroundImage = isDark 
    ? require('../assets/background-dark.png')
    : require('../assets/background.png');

  return {
    colors,
    typography,
    backgroundImage,
    isDark,
    colorScheme: currentColorScheme,
    settings,
  };
};

export type Theme = ReturnType<typeof useTheme>;