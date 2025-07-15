// App.js
// Gesi Morris-Odubo, T00686038

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseConfig } from './config/firebase';
import { ActivityIndicator, View } from 'react-native'; 

// Import Screens
import HomeScreen from './screens/HomeScreen';
import MedicationScreen from './screens/MedicationScreen';
import JournalScreen from './screens/JournalScreen';
import TrackProgressScreen from './screens/TrackProgressScreen';
import RemindersScreen from './screens/RemindersScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';


import { StreakProvider } from './contexts/streak';

const Stack = createStackNavigator();

// Initialize Firebase only if not already initialized
if (!getApps().length) {
  try {
    initializeApp(firebaseConfig);
    console.log('Firebase initialized in App.js');
  } catch (e) {
    console.error("Firebase initialization error:", e)
  }
} else {
  console.log('Firebase already initialized in App.js');
}

const auth = getAuth(); 

export default function App() {
  const [user, setUser] = useState(null); 
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log("Auth state changed:", authUser ? `User UID: ${authUser.uid}` : "No user");
      setUser(authUser);
      setLoadingAuth(false);
    });

    return unsubscribe;
  }, []);

  if (loadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <StreakProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={user ? 'Home' : 'Login'}
          screenOptions={{ headerShown: false }}
        >
          {user ? (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen
                 name="Take Medication"
                 component={MedicationScreen}
                 options={{ headerShown: true, title: 'Log Medication' }}
              />
              <Stack.Screen
                 name="Write Journal"
                 component={JournalScreen}
                 options={{ headerShown: true, title: 'Journal Entry' }}
               />
              <Stack.Screen
                 name="Track Progress"
                 component={TrackProgressScreen}
                  options={{ headerShown: true, title: 'Progress' }}
              />
              <Stack.Screen
                 name="Receive Reminders"
                 component={RemindersScreen}
                 options={{ headerShown: true, title: 'Set Reminders' }}
               />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </StreakProvider>
  );
}