// src/context/SettingsContext.tsx

import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontSizeKey = 'small' | 'medium' | 'large' | 'xlarge';
export type ProviderKey = 'maccabi' | 'clalit' | 'meuhedet' | 'leumit' | '';

export interface Settings {
  name:                 string;
  provider:             ProviderKey;
  notificationsEnabled: boolean;    // Appointment reminders
  remindersEnabled:     boolean;    // Medication reminders
  darkMode:             boolean;
  fontSizeKey:          FontSizeKey;
  language:             'en' | 'he';
  boldText:             boolean;
  highContrast:         boolean;
}

const STORAGE_KEY = '@evercare_settings';

export const DEFAULT_SETTINGS: Settings = {
  name:                 '',
  provider:             '',
  notificationsEnabled: true,
  remindersEnabled:     false,
  darkMode:             false,
  fontSizeKey:          'medium',
  language:             'en',
  boldText:             false,
  highContrast:         false,
};

export interface SettingsContextProps {
  settings:       Settings;
  updateSettings: (changes: Partial<Settings>) => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextProps>({
  settings:       DEFAULT_SETTINGS,
  updateSettings: async () => {},
});

export function SettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // load from storage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(json => {
        if (json) setSettings(JSON.parse(json));
      })
      .catch(console.error);
  }, []);

  const updateSettings = async (changes: Partial<Settings>) => {
    const updated = { ...settings, ...changes };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save settings', err);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
