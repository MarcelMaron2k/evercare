import { useColorScheme, Appearance } from 'react-native';
import { useState, useEffect } from 'react';

export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState(systemColorScheme);

  useEffect(() => {
    // Set initial theme
    setColorScheme(systemColorScheme);

    // Listen for theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      console.log('Theme changed to:', newColorScheme);
      setColorScheme(newColorScheme);
    });

    // Cleanup listener
    return () => subscription?.remove();
  }, [systemColorScheme]);

  const isDark = colorScheme === 'dark';

  const colors = {
    // Background colors
    background: isDark ? '#000000' : '#f9f9f9',
    card: isDark ? '#1c1c1e' : '#ffffff',
    surface: isDark ? '#2c2c2e' : '#ffffff',
    
    // Text colors
    text: isDark ? '#ffffff' : '#000000',
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

  return {
    colors,
    isDark,
    colorScheme,
  };
};

export type Theme = ReturnType<typeof useTheme>;