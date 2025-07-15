import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import { useStreak } from '../contexts/streak';

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const RemindersScreen = () => {
  const [reminderText, setReminderText] = useState('');
  const [reminderDay, setReminderDay] = useState(daysOfWeek[0]);
  const [reminderHour, setReminderHour] = useState('09');
  const [reminderMinute, setReminderMinute] = useState('00');
  const [isSaving, setIsSaving] = useState(false);

  const navigation = useNavigation();
  const auth = getAuth();
  const db = getFirestore();
  const { increaseStreak } = useStreak();

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync({
             ios: {
               allowAlert: true,
               allowBadge: true,
               allowSound: true,
             },
          });
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Notifications are needed for reminders. Please enable them in settings.',
            [{ text: 'OK' }]
          );
          return false;
        }
        return true;
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
        Alert.alert('Permission Error', 'Failed to get notification permissions.');
        return false;
      }
    } else {
      
      return true;
    }
  };

  const handleSetReminder = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const timeString = `${reminderHour}:${reminderMinute}`;

    if (!reminderText.trim()) {
       Alert.alert('Input Required', 'Please enter a reminder description.');
       return;
    }
     if (!/^(?:[01]\d|2[0-3]):(?:[0-5]\d)$/.test(timeString)) {
       Alert.alert('Invalid Time', 'Please ensure time is in HH:MM format (e.g., 09:00 or 14:30).');
       return;
     }


    if (auth.currentUser) {
      setIsSaving(true);
      try {
        const userId = auth.currentUser.uid;
        const remindersCollection = collection(db, 'users', userId, 'reminders');

        const docRef = await addDoc(remindersCollection, {
          reminderText: reminderText.trim(),
          reminderDay: reminderDay,
          reminderTime: timeString,
          createdAt: serverTimestamp(),
          isActive: true,
        });
        const reminderId = docRef.id;

        await scheduleLocalNotification(reminderId, reminderText.trim(), reminderDay, timeString);

        increaseStreak();

        Alert.alert('Reminder Set!', 'Your reminder has been saved and scheduled.');

        setReminderText('');
        navigation.goBack();

      } catch (error) {
        console.error('Error setting reminder:', error);
        Alert.alert('Error', 'Failed to set reminder. Please try again.');
      } finally {
         setIsSaving(false);
      }
    } else {
      Alert.alert('Not Logged In', 'You must be logged in to set reminders.');
    }
  };

  const scheduleLocalNotification = async (id, text, day, time) => {
    try {
      const dayIndex = daysOfWeek.indexOf(day);
      const [hour, minute] = time.split(':').map(Number);
      const triggerWeekday = (dayIndex + 1) % 7 + 1;

      const trigger = {
        weekday: triggerWeekday,
        hour: hour,
        minute: minute,
        repeats: true,
      };

      await Notifications.cancelScheduledNotificationAsync(id);

      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: 'Health App Reminder',
          body: text,
          sound: 'default',
          data: { reminderId: id }
        },
        trigger: trigger,
      });

      console.log(`Notification ${id} scheduled successfully.`);

    } catch (error) {
      console.error('Error scheduling notification:', error);
      if (error.message.includes('permission')) {
         Alert.alert('Permission Error', 'Cannot schedule reminder. Notification permissions may have been revoked.');
      } else {
         Alert.alert('Notification Error', 'Failed to schedule the reminder notification.');
      }
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <LinearGradient colors={['#E6E6FA', '#B0E0E6']} style={styles.gradientContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.title}>Set Reminder</Text>

          <Text style={styles.label}>What's the reminder for?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Take Vitamin D"
            value={reminderText}
            onChangeText={setReminderText}
          />

          <Text style={styles.label}>Which day?</Text>
           <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={reminderDay}
                style={styles.picker}
                onValueChange={(itemValue) => setReminderDay(itemValue)}
                 itemStyle={styles.pickerItem}
              >
                {daysOfWeek.map((day) => (
                  <Picker.Item key={day} label={day} value={day} />
                ))}
              </Picker>
           </View>

          <Text style={styles.label}>What time?</Text>
          <View style={styles.timePickerContainer}>
             <View style={[styles.pickerWrapper, styles.timePickerItem]}>
               <Picker
                  selectedValue={reminderHour}
                  style={styles.picker}
                  onValueChange={(itemValue) => setReminderHour(itemValue)}
                  itemStyle={styles.pickerItem}
               >
                 {hours.map((hr) => (
                   <Picker.Item key={hr} label={hr} value={hr} />
                 ))}
               </Picker>
             </View>

             <Text style={styles.timeSeparator}>:</Text>

             <View style={[styles.pickerWrapper, styles.timePickerItem]}>
                <Picker
                   selectedValue={reminderMinute}
                   style={styles.picker}
                   onValueChange={(itemValue) => setReminderMinute(itemValue)}
                   itemStyle={styles.pickerItem}
                >
                  {minutes.map((min) => (
                    <Picker.Item key={min} label={min} value={min} />
                  ))}
                </Picker>
             </View>
          </View>

          <TouchableOpacity
             style={[styles.button, isSaving && styles.buttonDisabled]}
             onPress={handleSetReminder}
             disabled={isSaving}
           >
             {isSaving ? (
               <ActivityIndicator size="small" color="#ffffff"/>
             ) : (
               <Text style={styles.buttonText}>Set Reminder & Update Streak</Text>
             )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    fontSize: 16,
  },
   pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    height: Platform.OS === 'ios' ? 120 : 55,
    justifyContent: 'center',
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 120 : 55,
  },
  pickerItem: {
     height: 120,
     fontSize: 18,
  },
  timePickerContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     marginBottom: 25,
   },
  timePickerItem: {
     flex: 1,
     marginHorizontal: 5,
     height: Platform.OS === 'ios' ? 120 : 55,
   },
  timeSeparator: {
     fontSize: 24,
     fontWeight: 'bold',
     marginHorizontal: 5,
     color: '#555',
   },
  button: {
    backgroundColor: '#1E90FF',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    minHeight: 50,
    justifyContent: 'center',
  },
   buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default RemindersScreen;