// src/screens/addAppointment.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Calendar, DateData, CalendarProps } from 'react-native-calendars';
import type { Provider, Doctor, Slot, Appointment } from '../types/appointment';
import {
  getProviders,
  getDoctors,
  getSlots,
  saveBookedAppointment,
} from '../services/appointmentService';
import { addAppointmentToCalendar } from '../services/calendarService';

// Define the shape of each day’s marking for the calendar
interface DayMarking {
  selected?: boolean;
  selectedColor?: string;
  marked?: boolean;
  dotColor?: string;
}

// Component to render one slot row in the FlatList
type SlotItemProps = {
  name: string;
  slot: Slot;
  onBook: (s: Slot) => void;
};
const SlotItem: React.FC<SlotItemProps> = ({ name, slot, onBook }) => (
  <TouchableOpacity style={styles.slotItem} onPress={() => onBook(slot)}>
    <Text>{name}</Text>
  </TouchableOpacity>
);

// Renamed export from “Appointments” → “AddAppointment”
const AddAppointment: React.FC = () => {
  // ─────────────────────────────────────────────────────────────────────────
  // State for providers, doctors, selected IDs, slots by day, loading flag
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selProv, setSelProv] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selDoc, setSelDoc] = useState<string>('');
  const [slotsByDay, setSlotsByDay] = useState<Record<string, Slot[]>>({});
  const [loading, setLoading] = useState(false);

  // Which calendar day is selected (YYYY-MM-DD). Default to today.
  const todayString = new Date().toISOString().split('T')[0];
  const [selectedDay, setSelectedDay] = useState<string>(todayString);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch mock slots, group them by date
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    const raw: Slot[] = await getSlots(selProv, selDoc, '', '');
    const grouped: Record<string, Slot[]> = {};

    raw.forEach((s) => {
      const day = s.startTime.split('T')[0];
      if (!grouped[day]) {
        grouped[day] = [];
      }
      if (s.isAvailable) {
        grouped[day].push(s);
      }
    });

    setSlotsByDay(grouped);
    setLoading(false);

    // If selectedDay has no slots, pick the first day that does
    if (!grouped[selectedDay] || grouped[selectedDay].length === 0) {
      const first = Object.keys(grouped)[0];
      if (first) setSelectedDay(first);
    }
  }, [selProv, selDoc, selectedDay]);

  // ─────────────────────────────────────────────────────────────────────────
  // On mount: load providers
  useEffect(() => {
    const p = getProviders();
    setProviders(p);
    if (p.length) {
      setSelProv(p[0].id);
    }
  }, []);

  // When provider changes: load doctors
  useEffect(() => {
    if (!selProv) return;
    setDoctors([]);
    setSelDoc('');
    getDoctors(selProv).then((docs) => {
      setDoctors(docs);
      if (docs.length) setSelDoc(docs[0].id);
    });
  }, [selProv]);

  // When both provider & doctor are set: fetch slots
  useEffect(() => {
    if (selProv && selDoc) {
      fetchSlots();
    }
  }, [selProv, selDoc, fetchSlots]);

  // ─────────────────────────────────────────────────────────────────────────
  // When a slot is tapped: save locally, add to calendar, then remove from availability
  const handleBook = useCallback(
    async (slot: Slot) => {
      const prov = providers.find((p) => p.id === selProv)!;
      const doc = doctors.find((d) => d.id === selDoc)!;
      const appt: Appointment = { provider: prov, doctor: doc, slot };

      try {
        // 1) Save to AsyncStorage
        await saveBookedAppointment(appt);

        // 2) Add to native calendar
        await addAppointmentToCalendar(appt);

        // 3) Remove this slot from slotsByDay so it no longer shows as available
        setSlotsByDay((prev) => {
          const dayKey = slot.startTime.split('T')[0];
          const updatedDaySlots = (prev[dayKey] || []).filter(
            (s) => s.slotId !== slot.slotId
          );
          if (updatedDaySlots.length === 0) {
            const { [dayKey]: _, ...rest } = prev;
            return rest;
          }
          return {
            ...prev,
            [dayKey]: updatedDaySlots,
          };
        });

        Alert.alert(
          'Success',
          'Appointment saved locally and added to your calendar!'
        );
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Could not save or schedule appointment.');
      }
    },
    [providers, doctors, selProv, selDoc]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render one slot row for the selected day
  const renderSlot = useCallback(
    ({ item }: { item: Slot }) => {
      const name = `${new Date(item.startTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })} – ${item.branch.name}`;
      return <SlotItem name={name} slot={item} onBook={handleBook} />;
    },
    [handleBook]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Build markedDates for <Calendar>:
  // - Dot on days that have ≥1 slot
  // - Highlight the currently selectedDay
  const markedDates: CalendarProps['markedDates'] = useMemo(() => {
    const marks: Record<string, DayMarking> = {};

    Object.keys(slotsByDay).forEach((dateKey) => {
      if (slotsByDay[dateKey].length > 0) {
        marks[dateKey] = { marked: true, dotColor: '#007AFF' };
      }
    });

    if (marks[selectedDay]) {
      marks[selectedDay] = {
        ...marks[selectedDay],
        selected: true,
        selectedColor: '#007AFF',
      };
    } else {
      marks[selectedDay] = { selected: true, selectedColor: '#007AFF' };
    }

    return marks;
  }, [slotsByDay, selectedDay]);

  // ─────────────────────────────────────────────────────────────────────────
  // While loading the first batch of slots, show a spinner if no data yet
  if (loading && Object.keys(slotsByDay).length === 0) {
    return <ActivityIndicator style={{ flex: 1, marginTop: 50 }} />;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Final render: Provider Picker → Doctor Picker → Calendar → FlatList
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Provider:</Text>
      <Picker
        selectedValue={selProv}
        onValueChange={setSelProv}
        style={styles.picker}
      >
        {providers.map((p) => (
          <Picker.Item key={p.id} label={p.name} value={p.id} />
        ))}
      </Picker>

      <Text style={styles.label}>Doctor:</Text>
      {doctors.length === 0 ? (
        <ActivityIndicator />
      ) : (
        <Picker
          selectedValue={selDoc}
          onValueChange={setSelDoc}
          style={styles.picker}
        >
          {doctors.map((d) => (
            <Picker.Item
              key={d.id}
              label={`${d.firstName} ${d.lastName}`}
              value={d.id}
            />
          ))}
        </Picker>
      )}

      <Calendar
        markedDates={markedDates}
        onDayPress={(day: DateData) => {
          setSelectedDay(day.dateString);
        }}
        theme={{
          todayTextColor: '#007AFF',
          selectedDayBackgroundColor: '#007AFF',
          dotColor: '#007AFF',
        }}
      />

      <FlatList
        data={slotsByDay[selectedDay] ?? []}
        keyExtractor={(item) => item.slotId}
        renderItem={renderSlot}
        ListEmptyComponent={
          <View style={styles.emptyDate}>
            <Text>No slots on this day</Text>
          </View>
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 16,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: {
    marginHorizontal: 16,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  picker: { marginHorizontal: 16 },
  slotItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    padding: 12,
    elevation: 2,
  },
  emptyDate: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
});

export default AddAppointment;
