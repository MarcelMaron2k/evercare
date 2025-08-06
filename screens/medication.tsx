// src/screens/MedicationScreen.tsx

import React, { useState, useEffect, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  ToastAndroid,
  Alert,
  ImageBackground,
} from 'react-native';
import firebase, { auth, db } from '../firebase';
import { Picker } from '@react-native-picker/picker';
import { SettingsContext } from '../context/SettingsContext';
import { useTheme } from '../utils/theme';

const { width, height } = Dimensions.get('window');

export default function MedicationScreen() {
  const { settings } = useContext(SettingsContext);
  const { colors, typography, backgroundImage } = useTheme();
  const uid   = auth.currentUser!.uid;
  const medsRef = db.collection('users').doc(uid).collection('medications');

  // form state
  const [searchText,    setSearchText]    = useState('');
  const [suggestions,   setSuggestions]   = useState<string[]>([]);
  const [name,          setName]          = useState('');
  const [amount,        setAmount]        = useState(1);
  const [doseCount,     setDoseCount]     = useState(1);
  const [periodCount,   setPeriodCount]   = useState(1);
  const [periodUnit,    setPeriodUnit]    = useState<'day'|'week'>('day');
  const [durationCount, setDurationCount] = useState(1);
  const [durationUnit,  setDurationUnit]  = useState<'day'|'week'>('day');

  // current meds list
  const [medList, setMedList] = useState<{ id: string; data: any }[]>([]);

  // Utility: toast or alert
  const showToast = (msg: string) => {
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert(msg);
  };

  // Listen for meds, auto-remove expired
  useEffect(() => {
    const unsub = medsRef
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const now = Date.now();
        const live: {id:string;data:any}[] = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.expiresAt) {
            const exp = (data.expiresAt as firebase.firestore.Timestamp).toMillis();
            if (exp < now) {
              medsRef.doc(doc.id).delete().catch(console.error);
              return;
            }
          }
          live.push({ id: doc.id, data });
        });
        setMedList(live);
      }, console.error);
    return () => unsub();
  }, []);

  // Autocomplete
  useEffect(() => {
    if (searchText.length < 2) {
      setSuggestions([]);
      return;
    }
    const q = searchText.toLowerCase();
    db.collection('drugs')
      .orderBy('name')
      .startAt(q)
      .endAt(q + '\uf8ff')
      .limit(5)
      .get()
      .then(snap => setSuggestions(snap.docs.map(d => d.data().name)))
      .catch(console.error);
  }, [searchText]);

  const addMedication = async () => {
    if (!name) {
      showToast('Please select a drug name.');
      return;
    }
    const now = Date.now();
    const days = durationUnit === 'week' ? durationCount * 7 : durationCount;
    const expiresAt = firebase.firestore.Timestamp.fromMillis(
      now + days * 24*60*60*1000
    );

    await medsRef.add({
      name,
      amount,
      doseCount,
      periodCount,
      periodUnit,
      durationCount,
      durationUnit,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      expiresAt,
    });

    // reset form
    setName('');
    setSearchText('');
    setAmount(1);
    setDoseCount(1);
    setPeriodCount(1);
    setPeriodUnit('day');
    setDurationCount(1);
    setDurationUnit('day');
    setSuggestions([]);
  };

  const removeMedication = (id: string) => {
    medsRef.doc(id).delete().catch(console.error);
  };

  // Render header (form) for FlatList
  const ListHeader = () => (
    <View>
      {/* Drug Lookup Card */}
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <Text style={[styles.cardTitle, { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor }]}>
          Drug Name
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="Search drug…"
          placeholderTextColor={colors.textSecondary}
          value={searchText || name}
          onChangeText={t => { setSearchText(t); setName(''); }}
        />
        {searchText.length >= 2 && suggestions.length > 0 && (
          <View style={[styles.suggestions, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {suggestions.map(s => (
              <Pressable
                key={s}
                onPress={() => { setName(s); setSearchText(''); setSuggestions([]); }}
                style={[styles.suggestionItem, { borderColor: colors.separator }]}
              >
                <Text style={[styles.suggestionText, { fontSize: typography.fontSize, color: typography.textColor }]}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Dosage & Schedule Card */}
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <Text style={[styles.cardTitle, { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor }]}>
          Amount (units per dose)
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          keyboardType="number-pad"
          placeholderTextColor={colors.textSecondary}
          value={String(amount)}
          onChangeText={t => setAmount(+t||1)}
        />

        <Text style={[styles.cardTitle, { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor }]}>
          Frequency
        </Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.smallInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            keyboardType="number-pad"
            placeholderTextColor={colors.textSecondary}
            value={String(doseCount)}
            onChangeText={t => setDoseCount(+t||1)}
          />
          <Text style={[styles.centerText, { fontSize: typography.fontSize, color: typography.textColor }]}>per</Text>
          <TextInput
            style={[styles.smallInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            keyboardType="number-pad"
            placeholderTextColor={colors.textSecondary}
            value={String(periodCount)}
            onChangeText={t => setPeriodCount(+t||1)}
          />
          <Picker
            selectedValue={periodUnit}
            style={styles.picker}
            onValueChange={v => setPeriodUnit(v as any)}
          >
            <Picker.Item label="day" value="day" />
            <Picker.Item label="week" value="week" />
          </Picker>
        </View>

        <Text style={[styles.cardTitle, { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor }]}>
          Duration
        </Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.smallInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            keyboardType="number-pad"
            placeholderTextColor={colors.textSecondary}
            value={String(durationCount)}
            onChangeText={t => setDurationCount(+t||1)}
          />
          <Picker
            selectedValue={durationUnit}
            style={styles.picker}
            onValueChange={v => setDurationUnit(v as any)}
          >
            <Picker.Item label="day" value="day" />
            <Picker.Item label="week" value="week" />
          </Picker>
        </View>
      </View>

      {/* Submit Card */}
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <Pressable style={[styles.addButton, { backgroundColor: colors.success }]} onPress={addMedication}>
          <Text style={[styles.addButtonText, { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: colors.card }]}>
            Add Medication
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionHeader, { fontSize: typography.fontSize + 2, fontWeight: typography.fontWeight, color: typography.textColor }]}>
        Your Medications
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
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FlatList
            data={medList}
            keyExtractor={item => item.id}
            ListHeaderComponent={ListHeader}
            renderItem={({ item }) => {
              const d = item.data;
              return (
                <View style={[styles.medCard, { backgroundColor: colors.card }]}>
                  <View style={styles.medText}>
                    <Text style={[styles.medName, { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor }]}>
                      {d.name}
                    </Text>
                    <Text style={[styles.medDetail, { fontSize: typography.fontSize - 2, color: colors.textSecondary }]}>
                      {d.amount} unit(s) — {d.doseCount} per {d.periodCount} {d.periodUnit}(s) for {d.durationCount} {d.durationUnit}(s)
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.removeButton, { backgroundColor: colors.danger }]}
                    onPress={() => removeMedication(item.id)}
                  >
                    <Text style={[styles.removeText, { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: colors.card }]}>
                      Remove
                    </Text>
                  </Pressable>
                </View>
              );
            }}
            contentContainerStyle={[styles.listContainer, { paddingHorizontal: 16 }]}
          />
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1 },
  background:      { flex: 1, width, height },
  bgImage:         { opacity: 0.6, resizeMode: 'cover' },
  flex:            { flex: 1 },

  scroll:          { padding: 16, paddingBottom: 32 },
  card:            {
    borderRadius:    8,
    padding:         16,
    marginBottom:    16,
    shadowOpacity:   0.05,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  cardTitle:       { marginBottom: 8 },
  input:           {
    borderWidth:  1,
    borderRadius: 6,
    padding:      12,
    marginBottom: 12,
  },
  suggestions:     {
    borderWidth:  1,
    borderRadius: 6,
    marginBottom: 12,
  },
  suggestionItem:  { padding: 12, borderBottomWidth: 1 },
  suggestionText:  {},
  row:             { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  smallInput:      {
    borderWidth:  1,
    borderRadius: 6,
    padding:      12,
    width:        64,
    textAlign:    'center',
    marginRight:  8,
  },
  centerText:      { marginHorizontal: 8 },
  picker:          { flex: 1, marginLeft: 8 },
  addButton:       { paddingVertical: 14, borderRadius: 6, alignItems: 'center' },
  addButtonText:   {},
  sectionHeader:   { marginBottom: 12, marginTop: 8 },

  medCard:         {
    borderRadius:    8,
    padding:         16,
    marginBottom:    12,
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    shadowOpacity:   0.03,
    shadowRadius:    4,
    shadowOffset:    { width: 0, height: 1 },
    elevation:       1,
  },
  medText:         { flex: 1, marginRight: 12 },
  medName:         {},
  medDetail:       {},
  removeButton:    { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  removeText:      {},
  listContainer:   { paddingBottom: 32 },
});
