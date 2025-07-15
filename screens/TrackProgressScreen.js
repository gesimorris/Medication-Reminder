import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const TrackProgressScreen = () => {
  const [medicationLogs, setMedicationLogs] = useState([]);
  const [journals, setJournals] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      setLoading(true);
      const listeners = [];

      const medicationLogsQuery = query(
        collection(db, 'users', userId, 'medicationLogs'),
        orderBy('timestamp', 'desc')
      );
      listeners.push(onSnapshot(
        medicationLogsQuery,
        (snapshot) => {
          const logList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMedicationLogs(logList);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching medication logs:", error);
          setLoading(false);
        }
      ));

      const journalQuery = query(
        collection(db, 'users', userId, 'journal'),
        orderBy('timestamp', 'desc')
      );
      listeners.push(onSnapshot(journalQuery, (snapshot) => {
        const journalList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setJournals(journalList);
      }, (error) => {
         console.error("Error fetching journal entries:", error);
      }));

      const remindersQuery = query(
        collection(db, 'users', userId, 'reminders'),
        orderBy('createdAt', 'desc')
      );
      listeners.push(onSnapshot(
        remindersQuery,
        (snapshot) => {
          const reminderList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setReminders(reminderList);
        },
        (error) => {
           console.error("Error fetching reminders:", error);
        }
      ));

      return () => {
        listeners.forEach(unsubscribe => unsubscribe());
      };
    } else {
        setLoading(false);
        setMedicationLogs([]);
        setJournals([]);
        setReminders([]);
    }
  }, [auth.currentUser?.uid]);

  const handleDeleteItem = async (collectionName, itemId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const itemDocRef = doc(db, 'users', userId, collectionName, itemId);
      await deleteDoc(itemDocRef);
    } catch (error) {
      console.error(`Error deleting item from ${collectionName}`, error);
      Alert.alert('Error', `Failed to delete item.`);
    }
  };

  const showDeleteConfirmation = (collectionName, itemId) => {
    Alert.alert(
      'Delete Confirmation',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteItem(collectionName, itemId) },
      ],
      { cancelable: true }
    );
  };

  const renderMedicationLogItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.itemContent}>
         <Text style={styles.listItemTextMain}>{item.medicationName}</Text>
         {item.dosage && <Text style={styles.listItemTextSub}>{item.dosage}</Text>}
      </View>
      {item.timestamp && (
        <Text style={styles.listItemDate}>
          {item.timestamp.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' ' + item.timestamp.toDate().toLocaleDateString()}
        </Text>
      )}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => showDeleteConfirmation('medicationLogs', item.id)}
      >
        <Feather name="trash-2" size={20} color="#E53935" />
      </TouchableOpacity>
    </View>
  );

  const renderJournalItem = ({ item }) => (
     <View style={styles.listItem}>
       <View style={styles.itemContent}>
          <Text style={styles.listItemTextMain} numberOfLines={2}>{item.text}</Text>
       </View>
       {item.timestamp && (
         <Text style={styles.listItemDate}>
           {item.timestamp.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' ' + item.timestamp.toDate().toLocaleDateString()}
         </Text>
       )}
       <TouchableOpacity
         style={styles.deleteButton}
         onPress={() => showDeleteConfirmation('journal', item.id)}
       >
         <Feather name="trash-2" size={20} color="#E53935" />
       </TouchableOpacity>
     </View>
   );

   const renderReminderItem = ({ item }) => (
     <View style={styles.listItem}>
       <View style={styles.itemContent}>
          <Text style={styles.listItemTextMain}>{item.reminderText}</Text>
          {item.reminderDay && item.reminderTime && <Text style={styles.listItemTextSub}>{`${item.reminderDay} at ${item.reminderTime}`}</Text>}
       </View>
       {item.createdAt && (
         <Text style={styles.listItemDate}>
           Set: {item.createdAt.toDate().toLocaleDateString()}
         </Text>
       )}
       <TouchableOpacity
         style={styles.deleteButton}
         onPress={() => showDeleteConfirmation('reminders', item.id)}
       >
         <Feather name="trash-2" size={20} color="#E53935" />
       </TouchableOpacity>
     </View>
   );


  if (loading) {
      return (
          <LinearGradient colors={['#F8F8FF', '#F0FFF0']} style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#555" />
          </LinearGradient>
      );
  }

  return (
    <LinearGradient colors={['#F8F8FF', '#F0FFF0']} style={styles.gradientContainer}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Track Progress</Text>

        <Text style={styles.subtitle}>Medication History</Text>
        {medicationLogs.length > 0 ? (
          <FlatList
            data={medicationLogs}
            keyExtractor={(item) => item.id}
            renderItem={renderMedicationLogItem}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>No medication logged yet.</Text>
        )}

        <Text style={styles.subtitle}>Journal Entries</Text>
        {journals.length > 0 ? (
          <FlatList
            data={journals}
            keyExtractor={(item) => item.id}
            renderItem={renderJournalItem}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>No journal entries yet.</Text>
        )}

        <Text style={styles.subtitle}>Your Reminders</Text>
        {reminders.length > 0 ? (
          <FlatList
            data={reminders}
            keyExtractor={(item) => item.id}
            renderItem={renderReminderItem}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>No reminders set yet.</Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#48D1CC',
    marginTop: 25,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  listItem: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
      flex: 1,
      marginRight: 10,
  },
  listItemTextMain: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  listItemTextSub: {
    fontSize: 14,
    color: '#666',
  },
  listItemDate: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'right',
    minWidth: 100,
    marginRight: 10,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  emptyText: {
      textAlign: 'center',
      color: '#777',
      marginTop: 10,
      marginBottom: 20,
      fontSize: 15,
  }
});

export default TrackProgressScreen;