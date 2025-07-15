
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; 
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useStreak } from '../contexts/streak'; 

const HomeScreen = () => {
  const navigation = useNavigation();
  const auth = getAuth();
  const user = auth.currentUser;
  const [userDocData, setUserDocData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const animation = useState(new Animated.Value(0))[0];
  const { streak, loadingStreak } = useStreak(); 
  const db = getFirestore();

  const fetchUserData = useCallback(async () => {
    if (!user) {
      setUserDocData(null); 
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setUserDocData(docSnap.data());

      } else {
        console.log('No Firestore document found for this user');
        setUserDocData(null); 
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserDocData(null); 
    } finally {
      setLoadingData(false); 
    }
  }, [user?.uid, db]); 


  useFocusEffect(
    useCallback(() => {
      fetchUserData(); 

      animation.setValue(0);
      Animated.timing(animation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.circle),
        useNativeDriver: false, 
      }).start();

      return () => {
        animation.setValue(0); 
      };
    }, [fetchUserData, animation])
  );

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Badges
  const getMedicationBadge = () => {
    return userDocData?.hasLoggedFirstMedication ? '💊' : '🔒';
  };

  const getJournalBadge = () => {
    return userDocData?.hasWrittenFirstJournal ? '✍️' : '🔒';
  };


  if (loadingData || loadingStreak) {
    return (
      <LinearGradient colors={['#B0E0E6', '#87CEFA']} style={styles.loadingContainer}>
         <ActivityIndicator size="large" color="#fff" />
         <Text style={styles.loadingText}>Loading...</Text>
      </LinearGradient>
    );
  }

  if (!user) {
     return (
       <LinearGradient colors={['#B0E0E6', '#87CEFA']} style={styles.loadingContainer}>
         <Text style={styles.loadingText}>Please Log In</Text>
       </LinearGradient>
     );
  }

  return (
    <LinearGradient colors={['#B0E0E6', '#87CEFA']} style={styles.gradientContainer}>
      <View style={styles.container}>
         {/* Welcome Message */}
         <Text style={styles.welcomeText}>
           Welcome{userDocData?.firstName ? `, ${userDocData.firstName}` : ''}
         </Text>

        {/*Streak Circle */}
        <Animated.View
          style={[
            styles.progressCircle,
            {
              borderRadius: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 60],
              }),
               transform: [ 
                {
                  scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Display streak from context */}
          <Text style={styles.progressNumber}>{streak}</Text>
        </Animated.View>

        {/* Badges Section */}
        <Text style={styles.badgesText}>Your Badges</Text>
        <View style={styles.badgesContainer}>
          <TouchableOpacity style={styles.badge} onPress={() => alert('Log your first medication to unlock!')}>
            <Text style={styles.badgeText}>{getMedicationBadge()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.badge} onPress={() => alert('Write your first journal entry to unlock!')}>
            <Text style={styles.badgeText}>{getJournalBadge()}</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Buttons */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Take Medication')}
        >
          <Text style={styles.buttonText}>Log Medication</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Write Journal')}
        >
          <Text style={styles.buttonText}>Write Journal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Track Progress')}
        >
          <Text style={styles.buttonText}>Track Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Receive Reminders')}
        >
          <Text style={styles.buttonText}>Set Reminders</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Feather name="log-out" size={20} color="white" />
            <Text style={[styles.buttonText, { marginLeft: 10 }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};


const styles = StyleSheet.create({
    gradientContainer: {
      flex: 1,
    },
    container: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 60, 
      paddingHorizontal: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 18,
      color: '#fff',
      marginTop: 10,
    },
    welcomeText: {
      fontSize: 28, 
      fontWeight: 'bold',
      color: '#ffffff', 
      marginBottom: 20,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.2)', 
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    progressCircle: {
      width: 130,
      height: 130, 
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 30, 
      borderWidth: 3, 
      borderColor: '#fff', 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 4,
    },
    progressNumber: {
      fontSize: 52, 
      fontWeight: 'bold',
      color: '#005A9C',
    },
    badgesText: {
      fontSize: 20, 
      fontWeight: '600', 
      color: '#ffffff', 
      marginBottom: 10,
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 1,
    },
    badgesContainer: {
      flexDirection: 'row',
      marginBottom: 35, 
    },
    badge: {
      width: 65, 
      height: 65, 
      borderRadius: 32.5,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 12,
      borderWidth: 1,
      borderColor: '#fff',
       shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3,
    },
    badgeText: {
      fontSize: 30,
    },
    button: {
      backgroundColor: '#1E90FF',
      paddingVertical: 14,
      borderRadius: 25,
      marginBottom: 18,
      width: '85%',
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
       shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 4,
    },
    buttonText: {
      color: 'white',
      fontSize: 17,
      fontWeight: '600',
      textAlign: 'center',
    },
     logoutButton: {
      backgroundColor: '#FF6347',
      paddingVertical: 12,
      borderRadius: 25,
      marginTop: 20,
      width: '85%', 
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
       shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 4,
    },
  });

export default HomeScreen;