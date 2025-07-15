
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';

const JournalScreen = () => {
  const [entry, setEntry] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const navigation = useNavigation();
  const auth = getAuth();
  const db = getFirestore();

  const handleSaveJournalEntry = async () => {
    if (!entry.trim()) {
       Alert.alert('Input Required', 'Please write something in your journal.');
       return;
    }
    if (!auth.currentUser) {
        Alert.alert('Login Required', 'Please ensure you are logged in.');
        return;
    }

    setIsSaving(true);

    try {
      const userId = auth.currentUser.uid;
      const userDocRef = doc(db, 'users', userId);
      const journalCollection = collection(userDocRef, 'journal');

      
      let isFirstEntry = false;
      try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            isFirstEntry = !userData?.hasWrittenFirstJournal;
          } else {
              isFirstEntry = true;
              console.log("User document doesn't exist yet, will mark as first journal entry.");
          }
      } catch (fetchError) {
          console.error("Error fetching user document before saving journal:", fetchError);
      }


      await addDoc(journalCollection, {
        text: entry.trim(),
        timestamp: serverTimestamp(),
      });
      console.log("Journal entry added to subcollection.");

      if (isFirstEntry) {
         console.log("Attempting to update 'hasWrittenFirstJournal' flag...");
         await setDoc(userDocRef, {
             hasWrittenFirstJournal: true
         }, { merge: true });
         console.log("'hasWrittenFirstJournal' flag updated.");
      }

      Alert.alert('Success', 'Journal entry saved successfully!');
      setEntry(''); 
      navigation.goBack();

    } catch (error) {
      console.error('Error saving journal entry:', error);
      Alert.alert('Error', 'Failed to save journal entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LinearGradient colors={['#F0F8FF', '#E6E6FA']} style={styles.gradientContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.title}>Write Journal Entry</Text>
          <TextInput
            style={styles.input}
            multiline 
            placeholder="How are you feeling today? What's on your mind?" 
            value={entry}
            onChangeText={setEntry}
            textAlignVertical="top"
          />
          <TouchableOpacity
             style={[styles.button, isSaving && styles.buttonDisabled]}
             onPress={handleSaveJournalEntry}
             disabled={isSaving} 
           >
             {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" /> 
             ) : (
                <Text style={styles.buttonText}>Save Entry</Text> 
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
    padding: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4682B4',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#B0C4DE',
    borderRadius: 8,
    padding: 15,
    marginBottom: 25,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    minHeight: 200, 
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#5F9EA0', 
    paddingVertical: 15,
    borderRadius: 25, 
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    minHeight: 50, 
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc', 
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600', 
  },
});

export default JournalScreen;