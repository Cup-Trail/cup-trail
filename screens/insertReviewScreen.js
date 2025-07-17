import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Cup Trail🍵</Text>
      <Text style={styles.subtitle}>Track your favorite drinks from each shop!</Text>

      <View style={styles.buttonGroup}>
        <Button title="Add a Shop" onPress={() => navigation.navigate('InsertShop')} />
        {/* Add more buttons/screens later like Favorites */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F3FBF7',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    color: '#555',
  },
  buttonGroup: {
    gap: 12,
  },
});
