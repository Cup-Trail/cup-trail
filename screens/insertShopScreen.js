import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { GOOGLE_API_KEY } from '@env';
import React, { useState } from 'react';
import { insertShop } from '../apis/shops';

export default function InsertShopScreen() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState('');
  const [activeField, setActiveField] = useState(null);

  const handleSubmit = async () => {
    setMessage('Submitting...');
    const result = await insertShop(name, address, latitude, longitude);
    if (result?.success === true) {
      setMessage('✅ Shop added successfully!');
      setName('');
      setAddress('');
      setLatitude(null);
      setLongitude(null);
    } else {
      if (result.code === 'duplicate') {
        setMessage('❌ Shop location already exists.');
      } else {
        setMessage('❌ Failed to add shop');
      }
    }

    setSuggestions([]);
  };

  const fetchAutocomplete = async (input) => {
    if (!input) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&key=${GOOGLE_API_KEY}&types=establishment&language=en`
      );
      const json = await response.json();
      setSuggestions(json.predictions || []);
    } catch (err) {
      console.error('Autocomplete error:', err);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const { name, formatted_address, geometry } = data.result || {};
        const lat = geometry?.location?.lat;
        const lng = geometry?.location?.lng;
        console.log(formatted_address);

        if (activeField === 'name' && name) setName(name);
        if (formatted_address) setAddress(formatted_address);
        if (lat != null && lng != null) {
          setLatitude(lat);
          setLongitude(lng);
          console.log('Lat:', lat, 'Lng:', lng);
        }
      } else {
        console.warn('Place Details failed:', data.status);
      }
    } catch (error) {
      console.error('Failed to fetch place details:', error);
    }
    setSuggestions([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Shop Name</Text>
      <TextInput
        value={name}
        onChangeText={(text) => {
          setName(text);
          setActiveField('name');
          fetchAutocomplete(text);
        }}
        style={styles.input}
        placeholder="Boba Bliss"
      />

      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestion}
              onPress={() => handleSelectSuggestion(item)}
            >
              <Text>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Button title="Insert Shop" onPress={handleSubmit} />
      {message !== '' && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
  },
  suggestion: {
    padding: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
  },
});
