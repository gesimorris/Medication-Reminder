import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const auth = getAuth();
  const animation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert('Signup failed: ' + error.message);
      console.error('Signup error:', error);
    }
  };

  return (
    <LinearGradient colors={['#FFB6C1', '#FF69B4']} style={styles.gradientContainer}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={{ ...styles.contentContainer, opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }}>
          <Text style={styles.title}>Create Account</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF1493',
    marginBottom: 40,
  },
  input: {
    borderWidth: 2,
    borderColor: '#FF1493',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    fontSize: 16,
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  button: {
    backgroundColor: '#FF1493',
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#FF1493',
    marginTop: 15,
    fontSize: 16,
  },
});

export default SignupScreen;