import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useTheme } from '../utils/theme';

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
  const { colors } = useTheme();
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
        <Text style={[styles.cardTitle, { color: colors.warning }]}>🚨 Fall Detected</Text>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(item.timestamp)}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.dataRow}>
          <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Duration:</Text>
          <Text style={[styles.dataValue, { color: colors.text }]}>{item.duration}ms</Text>
        </View>
        
        {item.location && (
          <View style={styles.dataRow}>
            <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Location:</Text>
            <TouchableOpacity 
              onPress={() => openLocationInMaps(item.location!.latitude, item.location!.longitude)}
              style={styles.locationButton}
            >
              <Text style={[styles.locationText, { color: colors.primary }]}>
                📍 {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
              </Text>
              <Text style={[styles.locationHint, { color: colors.textSecondary }]}>
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
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Falls Recorded</Text>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        Your fall detection history will appear here when events are detected.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Fall History</Text>
        
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
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
    fontSize: 18,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  locationButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default HistoryScreen;