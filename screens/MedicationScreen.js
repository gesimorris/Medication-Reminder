// screens/MedicationScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StyleSheet,
    ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';

const MedicationScreen = () => {
    const navigation = useNavigation();
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;

    const [medicationName, setMedicationName] = useState('');
    const [dosage, setDosage] = useState('');
    const [isLoadingUserData, setIsLoadingUserData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userDocData, setUserDocData] = useState(null);

    const fetchUserData = useCallback(async () => {
        if (!user) {
            setIsLoadingUserData(false);
            return;
        }
        setIsLoadingUserData(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                setUserDocData(docSnap.data());
            } else {
                console.log("MedicationScreen: User document not found.");
                setUserDocData(null);
            }
        } catch (error) {
            console.error("MedicationScreen: Error fetching user data:", error);
            Alert.alert("Error", "Could not load necessary user data.");
            setUserDocData(null);
        } finally {
            setIsLoadingUserData(false);
        }
    }, [user?.uid, db]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const handleLogMedication = async () => {
        if (!medicationName.trim() || !dosage.trim()) {
            Alert.alert("Input Required", "Please enter Medication Name and Dosage.");
            return;
        }
        if (!user) {
            Alert.alert("Error", "You are not logged in.");
            return;
        }
        if (isLoadingUserData) {
             Alert.alert("Please Wait", "Loading user information...");
             return;
        }

        setIsSaving(true);

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const logsCollection = collection(userDocRef, 'medicationLogs');

            await addDoc(logsCollection, {
                medicationName: medicationName.trim(),
                dosage: dosage.trim(),
                timestamp: serverTimestamp(),
            });
            console.log("Medication log added successfully.");

            const isFirstLog = !userDocData?.hasLoggedFirstMedication;

            if (isFirstLog) {
                console.log("Attempting to update 'hasLoggedFirstMedication' flag...");
                await setDoc(userDocRef, {
                    hasLoggedFirstMedication: true
                }, { merge: true });
                console.log("'hasLoggedFirstMedication' flag updated.");
            }

            Alert.alert("Success", "Medication logged successfully!");
            setMedicationName('');
            setDosage('');
            navigation.goBack();

        } catch (error) {
            console.error("Error logging medication:", error);
            Alert.alert("Error", "Failed to log medication. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingUserData) {
        return (
            <LinearGradient colors={['#E0FFFF', '#AFEEEE']} style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#008080" />
                <Text style={styles.loadingText}>Loading...</Text>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#E0FFFF', '#AFEEEE']} style={styles.gradientContainer}>
             <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.container}>
                    <Text style={styles.title}>Log Medication</Text>

                    <Text style={styles.label}>Medication Name:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Ibuprofen"
                        value={medicationName}
                        onChangeText={setMedicationName}
                    />

                    <Text style={styles.label}>Dosage:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., 200mg"
                        value={dosage}
                        onChangeText={setDosage}
                    />

                    <TouchableOpacity
                        style={[styles.button, isSaving && styles.buttonDisabled]}
                        onPress={handleLogMedication}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text style={styles.buttonText}>Log Medication</Text>
                        )}
                    </TouchableOpacity>
                </View>
             </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
     loadingText: {
      fontSize: 16,
      color: '#008080',
      marginTop: 10,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center'
    },
    container: {
        padding: 25
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#008080',
        marginBottom: 25,
        textAlign: 'center'
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderColor: '#AFEEEE',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 20,
        fontSize: 16
    },
    button: {
        backgroundColor: '#20B2AA',
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
        justifyContent: 'center'
    },
    buttonDisabled: {
        backgroundColor: '#cccccc'
    },
    buttonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600'
    },
});

export default MedicationScreen;