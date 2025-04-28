// src/screens/Medications.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  Pressable
} from 'react-native';
import debounce from 'lodash.debounce';

import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  doc,
  deleteDoc
} from 'firebase/firestore';

type Medication = {
  id: string;
  name: string;
  dosage: string;
  time: string;
  rxcui?: string;
};

export default function MedicationsScreen() {
  const [userId, setUserId]           = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [name, setName]               = useState('');
  const [dosage, setDosage]           = useState('');
  const [time, setTime]               = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // — auth / Firestore subscription (unchanged) —
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setUserId(user?.uid ?? null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!userId) return;
    const medsRef = collection(db, 'users', userId, 'medications');
    return onSnapshot(query(medsRef), snap =>
      setMedications(
        snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
      )
    );
  }, [userId]);

  // — fetch suggestions from RxNav approximateTerm endpoint —
  const fetchDrugSuggestions = async (term: string) => {
    if (term.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://rxnav.nlm.nih.gov/REST/approximateTerm.json` +
          `?term=${encodeURIComponent(term)}` +
          `&maxEntries=10`
      );
      const data = await res.json();
      // The JSON has an array under data.approximateGroup.candidate
      const names =
        data.approximateGroup?.candidate?.map(
          (c: any) => c.minConceptItem.name
        ) ?? [];
      setSuggestions(names);
    } catch {
      setSuggestions([]);
    }
  };

  // debounce to avoid firing on every keystroke
  const debouncedFetch = useMemo(
    () => debounce(fetchDrugSuggestions, 300),
    []
  );

  // call debounced fetch whenever name changes
  useEffect(() => {
    debouncedFetch(name);
  }, [name]);

  // — add / delete handlers (unchanged) —
  const handleAddMedication = async () => {
    if (!userId || !name.trim() || !dosage.trim() || !time.trim()) {
      return Alert.alert('All fields are required');
    }
    const medsRef = collection(db, 'users', userId, 'medications');

    // 1) duplicate-name check
    const dupSnap = await getDocs(
      query(medsRef, where('name', '==', name.trim()))
    );
    if (!dupSnap.empty) {
      return Alert.alert(
        'Duplicate Medication',
        `${name} is already on your list.`
      );
    }

    // 2) time conflict check
    const timeSnap = await getDocs(
      query(medsRef, where('time', '==', time))
    );
    if (!timeSnap.empty) {
      return Alert.alert(
        'Schedule Conflict',
        `You already have a medication set at ${time}.`
      );
    }

    // 3) write it
    try {
      await addDoc(medsRef, {
        name: name.trim(),
        dosage: dosage.trim(),
        time: time.trim(),
        addedAt: Date.now()
      });
      setName('');
      setDosage('');
      setTime('');
      setSuggestions([]);
    } catch (err: any) {
      Alert.alert('Failed to add medication', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'medications', id));
    } catch (err: any) {
      Alert.alert('Failed to delete', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Medications</Text>

      {/* Autocomplete Name Input */}
      <TextInput
        placeholder="Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              style={styles.suggestion}
              onPress={() => {
                setName(item);
                setSuggestions([]);
              }}
            >
              <Text>{item}</Text>
            </Pressable>
          )}
          style={styles.suggestionList}
        />
      )}

      <TextInput
        placeholder="Dosage"
        style={styles.input}
        value={dosage}
        onChangeText={setDosage}
      />
      <TextInput
        placeholder="Time (e.g. 08:00)"
        style={styles.input}
        value={time}
        onChangeText={setTime}
      />
      <Button title="Add Medication" onPress={handleAddMedication} />

      <FlatList
        data={medications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>
              {item.name} – {item.dosage} at {item.time}
            </Text>
            <Button title="Delete" onPress={() => handleDelete(item.id)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, padding: 20 },
  title:          { fontSize: 24, marginBottom: 12, textAlign: 'center' },
  input:          { borderWidth: 1, padding: 10, marginBottom: 8, borderRadius: 6 },
  suggestionList: { maxHeight: 150, marginBottom: 8, backgroundColor: '#fff' },
  suggestion:     { padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  item:           { marginVertical: 8, borderBottomWidth: 1, paddingBottom: 6 }
});
