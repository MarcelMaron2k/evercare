// screens/MedicationScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import firebase, { auth, db } from '../firebase';
import { Picker } from '@react-native-picker/picker';

export default function MedicationScreen() {
  const uid = auth.currentUser!.uid;
  const medsRef = db.collection('users').doc(uid).collection('medications');

  // form state
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(1);
  const [doseCount, setDoseCount] = useState(1);
  const [periodCount, setPeriodCount] = useState(1);
  const [periodUnit, setPeriodUnit] = useState<'day' | 'week'>('day');
  const [durationCount, setDurationCount] = useState(1);
  const [durationUnit, setDurationUnit] = useState<'day' | 'week'>('day');

  // current meds list
  const [medList, setMedList] = useState<{ id: string; data: any }[]>([]);

  // Listen for meds, auto-remove expired
  useEffect(() => {
    const unsub = medsRef
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snap => {
          const now = Date.now();
          const live: { id: string; data: any }[] = [];
          snap.docs.forEach(doc => {
            const data = doc.data();
            if (data.expiresAt) {
              const expMillis = (data.expiresAt as firebase.firestore.Timestamp).toMillis();
              if (expMillis < now) {
                // automatically delete expired medication
                medsRef.doc(doc.id).delete().catch(console.error);
                return;
              }
            }
            live.push({ id: doc.id, data });
          });
          setMedList(live);
        },
        err => console.error('Firestore onSnapshot error:', err)
      );
    return () => unsub();
  }, []);

  // Autocomplete: only for 2+ letters
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
      Alert.alert('Error', 'Please select a drug name.');
      return;
    }

    // compute expiresAt timestamp
    const now = Date.now();
    const days =
      durationUnit === 'week' ? durationCount * 7 : durationCount;
    const expiresAtMillis = now + days * 24 * 60 * 60 * 1000;
    const expiresAt = firebase.firestore.Timestamp.fromMillis(
      expiresAtMillis
    );

    // save med with expiresAt
    console.log(`Adding medication: ${name}, expires in ${days} days`);
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

    // DDI check (logs for debugging)
    console.log('Fetching meds for DDI check...');
    const snap = await medsRef.get();
    const meds = snap.docs.map(d => d.data());
    const others = meds.map(m => m.name).filter(n => n !== name);
    for (const other of others) {
      const key = [name, other].sort().join('_');
      console.log(`Checking interaction key: ${key}`);
      const doc = await db.collection('ddi').doc(key).get();
      console.log(`Doc.exists(${key}): ${doc.exists}`);
      if (doc.exists) {
        const interaction = doc.data()!.interaction;
        console.log(`Interaction for ${key}: ${interaction}`);
        Alert.alert(
          'Interaction detected',
          `${name} ↔ ${other}\n\n${interaction}`
        );
      }
    }

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Drug Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Search drug…"
          value={searchText || name}
          onChangeText={t => {
            setSearchText(t);
            setName('');
          }}
        />
        {searchText.length >= 2 && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  setName(s);
                  setSearchText('');
                  setSuggestions([]);
                }}
                style={styles.suggestionItem}
              >
                <Text>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Amount (units per dose)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={amount.toString()}
          onChangeText={t => setAmount(+t || 1)}
        />

        <Text style={styles.label}>Frequency</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.smallInput}
            keyboardType="number-pad"
            value={doseCount.toString()}
            onChangeText={t => setDoseCount(+t || 1)}
          />
          <Text style={styles.centerText}>per</Text>
          <TextInput
            style={styles.smallInput}
            keyboardType="number-pad"
            value={periodCount.toString()}
            onChangeText={t => setPeriodCount(+t || 1)}
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

        <Text style={styles.label}>Duration</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.smallInput}
            keyboardType="number-pad"
            value={durationCount.toString()}
            onChangeText={t => setDurationCount(+t || 1)}
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

        <Button title="Add Medication" onPress={addMedication} />
      </View>

      {/* Medications List */}
      <Text style={styles.medsTitle}>Your Medications</Text>
      <FlatList
        data={medList}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const d = item.data;
          return (
            <View style={styles.listItem}>
              <View style={styles.listItemText}>
                <Text>{d.name}</Text>
                <Text>
                  {d.amount} unit(s) — {d.doseCount} per {d.periodCount}{' '}
                  {d.periodUnit}(s) for {d.durationCount}{' '}
                  {d.durationUnit}(s)
                </Text>
              </View>
              <Button title="Remove" onPress={() => removeMedication(item.id)} />
            </View>
          );
        }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContainer}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 16, backgroundColor: '#fff' },
  label: { marginBottom: 4 },
  input: { borderWidth: 1, padding: 8, marginBottom: 12 },
  suggestionsContainer: { borderWidth: 1, marginBottom: 12 },
  suggestionItem: { padding: 8, borderBottomWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  smallInput: { borderWidth: 1, padding: 8, flex: 1, marginHorizontal: 4 },
  picker: { flex: 1 },
  centerText: { marginHorizontal: 4 },
  medsTitle: { margin: 16, fontSize: 18 },
  listContainer: { paddingBottom: 32 },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
  },
  listItemText: { flex: 1 },
});
