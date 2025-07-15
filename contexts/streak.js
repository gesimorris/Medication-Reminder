
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const StreakContext = createContext();

export const useStreak = () => useContext(StreakContext);

export const StreakProvider = ({ children }) => {
  const [streak, setStreak] = useState(0);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const auth = getAuth();
  const db = getFirestore();

  const loadStreak = useCallback(async () => {
     console.log("Attempting to load streak..."); 
     setLoadingStreak(true);
     const user = auth.currentUser;
     if (user) {
       try {
         const userDocRef = doc(db, 'users', user.uid);
         const docSnap = await getDoc(userDocRef);
         if (docSnap.exists()) {
           const data = docSnap.data();
           console.log("Streak data loaded from Firestore:", data.currentStreak); 
           setStreak(data.currentStreak || 0);
         } else {
            console.log("User doc for streak not found, setting streak to 0.");
            setStreak(0);
         }
       } catch (error) {
         console.error("Error loading streak:", error);
         setStreak(0);
       }
     } else {
       console.log("No user logged in, setting streak to 0."); 
       setStreak(0);
     }
     setLoadingStreak(false);
  }, [auth, db]); 


   const saveStreak = async (newStreak) => {
      const user = auth.currentUser;
      if (user) {
         console.log(`Attempting to save streak: ${newStreak}`); 
         try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
               currentStreak: newStreak,
               lastStreakUpdate: new Date()
            }).catch(async (error) => {
               if (error.code === 'not-found') {
                  console.log("User doc not found for update, attempting setDoc with merge.");
                  await setDoc(userDocRef, {
                     currentStreak: newStreak,
                     lastStreakUpdate: new Date()
                  }, { merge: true });
               } else {
                  throw error; 
               }
            });
            console.log("Streak saved successfully.");
         } catch (error) {
            console.error("Error saving streak:", error);
         }
      } else {
         console.log("Cannot save streak, no user logged in.");
      }
   };

  // Effect to load streak initially and listen for changes
  useEffect(() => {
     const unsubscribe = auth.onAuthStateChanged(user => {
       if (user) {
         loadStreak(); // Load streak when user logs in or app starts with logged-in user
       } else {
         setStreak(0); // Reset streak if user logs out
         setLoadingStreak(false);
       }
     });
     return unsubscribe; 
  }, [auth, loadStreak]); 

  // Function to increase streak
  const increaseStreak = () => {
    console.log("increaseStreak called");
    setStreak(prevStreak => {
        const newStreak = prevStreak + 1;
        saveStreak(newStreak); 
        return newStreak;
    });
  };


  const value = {
    streak,
    increaseStreak,
    loadingStreak,
    reloadStreak: loadStreak 
  };

  return (
    <StreakContext.Provider value={value}>
      {!loadingStreak ? children : null}
    </StreakContext.Provider>
  );
};