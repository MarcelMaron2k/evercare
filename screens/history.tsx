import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity, Linking, Platform, ImageBackground, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useTheme } from '../utils/theme';

const logo = require('../assets/logo.png');

interface FallEvent {
  id: string;
  timestamp: Date;
  acceleration: number;
  duration: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    provider: string;
  };
  readableTimestamp: string;
}

const HistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, typography, backgroundImage } = useTheme();
  const [fallHistory, setFallHistory] = useState<FallEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFallHistory = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to view fall history');
        return;
      }

      const fallsCollection = collection(db, 'users', currentUser.uid, 'falls');
      const fallsQuery = query(fallsCollection, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(fallsQuery);

      const falls: FallEvent[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        falls.push({
          id: doc.id,
          timestamp: data.timestamp.toDate(),
          acceleration: data.acceleration,
          duration: data.duration,
          location: data.location,
          readableTimestamp: data.readableTimestamp || data.timestamp.toDate().toLocaleString(),
        });
      });

      setFallHistory(falls);
    } catch (error) {
      console.error('Error fetching fall history:', error);
      Alert.alert('Error', 'Failed to load fall history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFallHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFallHistory();
  };

  const openLocationInMaps = (latitude: number, longitude: number) => {
    const label = 'Fall Location';
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });
    
    if (url) {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            // Fallback to Google Maps web
            const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
            return Linking.openURL(webUrl);
          }
        })
        .catch((err) => {
          console.error('Error opening maps:', err);
          Alert.alert('Error', 'Could not open maps application');
        });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderFallItem = ({ item }: { item: FallEvent }) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.warning, fontSize: typography.fontSize + 2, fontWeight: typography.fontWeight }]}>
          🚨 Fall Detected
        </Text>
        <Text style={[styles.dateText, { color: colors.textSecondary, fontSize: typography.fontSize - 2 }]}>
          {formatDate(item.timestamp)}
        </Text>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.dataRow}>
          <Text style={[styles.dataLabel, { color: colors.textSecondary, fontSize: typography.fontSize, fontWeight: typography.fontWeight }]}>
            Duration:
          </Text>
          <Text style={[styles.dataValue, { color: colors.text, fontSize: typography.fontSize }]}>
            {item.duration}ms
          </Text>
        </View>
        
        {item.location && (
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, { color: colors.textSecondary, fontSize: typography.fontSize, fontWeight: typography.fontWeight }]}>
              Location:
            </Text>
            <TouchableOpacity 
              onPress={() => openLocationInMaps(item.location!.latitude, item.location!.longitude)}
              style={styles.locationButton}
            >
              <Text style={[styles.locationText, { color: colors.primary, fontSize: typography.fontSize - 1 }]}>
                📍 {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
              </Text>
              <Text style={[styles.locationHint, { color: colors.textSecondary, fontSize: typography.fontSize - 3 }]}>
                Tap to open in Maps
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: typography.textColor, fontSize: typography.fontSize + 4, fontWeight: typography.fontWeight }]}>
        No Falls Recorded
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: typography.fontSize }]}>
        Your fall detection history will appear here when events are detected.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        imageStyle={styles.bgImage}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
          </Pressable>
          <Image source={logo} style={styles.logoTop} />
          <Text style={[styles.appName, { fontSize: 28, fontWeight: '600', color: typography.textColor }]}>
            EverCare
          </Text>
          <Text style={[styles.title, { color: typography.textColor, fontSize: typography.fontSize + 8, fontWeight: typography.fontWeight }]}>
            Fall History
          </Text>
        </View>

        <View style={styles.container}>
          <FlatList
            data={fallHistory}
            renderItem={renderFallItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={!loading ? renderEmptyState : null}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  bgImage: {
    opacity: 0.6,
    resizeMode: 'cover',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoTop: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  appName: {
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    // Dynamic styles applied inline
  },
  dateText: {
    // Dynamic styles applied inline
  },
  cardContent: {
    gap: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataLabel: {
    // Dynamic styles applied inline
  },
  dataValue: {
    // Dynamic styles applied inline
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyStateTitle: {
    marginBottom: 8,
    // Dynamic styles applied inline
  },
  emptyStateText: {
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    // Dynamic styles applied inline
  },
  locationButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  locationText: {
    fontWeight: '500',
    // Dynamic styles applied inline
  },
  locationHint: {
    fontStyle: 'italic',
    marginTop: 2,
    // Dynamic styles applied inline
  },
});

export default HistoryScreen;