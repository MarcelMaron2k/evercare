// src/screens/AddAppointment.tsx

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Calendar, DateData, CalendarProps } from 'react-native-calendars';
import {
  getProviders,
  getSlots,
  saveBookedAppointment,
} from '../services/appointment/appointmentService';
import { addAppointmentToCalendar } from '../services/calendarService';
import type { Provider, Slot, Appointment } from '../types/appointment';
import Colors from '../styles/Colors';
import { SettingsContext } from '../context/SettingsContext';

const background = require('../assets/background.png');
const { width, height } = Dimensions.get('window');

export default function AddAppointment() {
  // pull settings
  const { settings } = useContext(SettingsContext);
  const FONT_SIZES: Record<typeof settings.fontSizeKey, number> = {
    small: 14,
    medium: 16,
    large: 18,
    xlarge: 20,
  };
  const fontSize   = FONT_SIZES[settings.fontSizeKey];
  const fontWeight = settings.boldText ? '700' : '400';
  const textColor  = settings.highContrast
    ? '#000'
    : settings.darkMode
      ? Colors.white
      : Colors.blue;
  const bgColor    = settings.darkMode ? Colors.black : Colors.white;

  /* state & effects unchanged */
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selProv, setSelProv] = useState<string>('');
  const [slotsByDay, setSlotsByDay] = useState<Record<string, Slot[]>>({});
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [selectedDay, setSelectedDay] = useState(today);

  useEffect(() => {
    const list = getProviders();
    setProviders(list);
    if (list.length) setSelProv(list[0].id);
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!selProv) return;
    setLoading(true);
    try {
      const raw: Slot[] = await getSlots(selProv);
      const grouped: Record<string, Slot[]> = {};
      raw.forEach(s => {
        if (!s.startTime || !s.isAvailable) return;
        const day = s.startTime.split('T')[0];
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(s);
      });
      setSlotsByDay(grouped);
      if (!grouped[selectedDay]?.length && Object.keys(grouped).length) {
        setSelectedDay(Object.keys(grouped)[0]);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  }, [selProv, selectedDay]);

  useEffect(() => {
    fetchSlots();
  }, [selProv, fetchSlots]);

  const markedDates: CalendarProps['markedDates'] = useMemo(() => {
    const marks: Record<string, any> = {};
    Object.entries(slotsByDay).forEach(([day, slots]) => {
      if (slots.length) marks[day] = { marked: true, dotColor: Colors.green };
    });
    marks[selectedDay] = {
      ...(marks[selectedDay] || {}),
      selected: true,
      selectedColor: Colors.green,
    };
    return marks;
  }, [slotsByDay, selectedDay]);

  if (loading && !Object.keys(slotsByDay).length) {
    return <ActivityIndicator style={{ flex: 1, marginTop: 50 }} />;
  }

  const handleBook = useCallback(
    async (slot: Slot) => {
      const appt: Appointment = {
        provider: providers.find(p => p.id === selProv)!,
        doctor: { id: slot.doctorId, firstName: '', lastName: '', specialty: '', clinics: [] },
        slot,
      };
      try {
        await saveBookedAppointment(appt);
        await addAppointmentToCalendar(appt);
        setSlotsByDay(prev => {
          const day = slot.startTime.split('T')[0];
          const filtered = (prev[day] || []).filter(s => s.slotId !== slot.slotId);
          if (!filtered.length) {
            const { [day]: _, ...rest } = prev;
            return rest;
          }
          return { ...prev, [day]: filtered };
        });
      } catch (err) {
        console.error('Error booking slot:', err);
      }
    },
    [providers, selProv]
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ImageBackground
        source={background}
        style={styles.background}
        imageStyle={styles.bgImage}
      >
        <Text style={[styles.label, { fontSize, fontWeight, color: textColor }]}>
          Provider:
        </Text>
        <Picker
          selectedValue={selProv}
          onValueChange={setSelProv}
          style={styles.picker}
        >
          {providers.map(p => (
            <Picker.Item key={p.id} label={p.name} value={p.id} />
          ))}
        </Picker>

        <Calendar
          markedDates={markedDates}
          onDayPress={(day: DateData) => setSelectedDay(day.dateString)}
          theme={{
            todayTextColor: Colors.green,
            selectedDayBackgroundColor: Colors.green,
            dotColor: Colors.green,
          }}
        />

        <FlatList
          data={slotsByDay[selectedDay] || []}
          keyExtractor={item => item.slotId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.slotItem}
              onPress={() => handleBook(item)}
            >
              <Text style={[styles.slotText, { fontSize, color: textColor }]}>
                {new Date(item.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })} – {item.branch.name}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyDate}>
              <Text style={[styles.emptyText, { fontSize, color: textColor }]}>
                No slots available on this day
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
        />
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  background:    { flex: 1, width, height },
  bgImage:       { opacity: 0.6, resizeMode: 'cover' },
  label:         { margin: 16, fontWeight: '600' },
  picker:        { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 6 },
  slotItem:      {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop:       12,
    borderRadius:    8,
    padding:         16,
    shadowColor:     '#000',
    shadowOpacity:   0.03,
    shadowRadius:    4,
    shadowOffset:    { width: 0, height: 1 },
    elevation:       1,
  },
  slotText:      { },
  emptyDate:     { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  emptyText:     { },
  listContainer: { flexGrow: 1, paddingBottom: 16 },
});
