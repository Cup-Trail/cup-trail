// react
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { Button } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
// backend
import { GOOGLE_API_KEY } from '@env';
import { fetchRecentReviews } from '../apis/reviews';
import { insertShop } from '../apis/shops';

// mock data for now
const categories = ['Matcha', 'Boba', 'Coffee', 'Milk Tea', 'Fruit Tea'];

export default function SearchScreen() {
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState('');
  const [activeField, setActiveField] = useState(null);

  const clearForm = () => {
    setName('');
    setAddress('');
    setLatitude(null);
    setLongitude(null);
  };

  const handleSubmit = async () => {
    setMessage('Submitting...');
    setSuggestions([]);

    const result = await insertShop(name, address, latitude, longitude);

    if (result?.success) {
      setMessage('✅ Shop added successfully!');
      clearForm();
      return;
    }

    const errorMsg =
      result?.code === 'duplicate'
        ? '❌ Shop location already exists.'
        : '❌ Failed to add shop';

    setMessage(errorMsg);
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
  useEffect(() => {
    const fetchReviews = async () => {
      const result = await fetchRecentReviews();
      console.log('[SearchScreen] fetch result:', result);
      if (!result?.success) {
        console.warn('Error fetching reviews:', result?.message);
        return;
      }
      setReviews(result.data);
    };

    fetchReviews();
  }, []);
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        onChangeText={(text) => {
          setName(text);
          setActiveField('name');
          fetchAutocomplete(text);
        }}
        placeholder="Search shops, drinks, or cities..."
        value={name}
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

      <Button title="Add" onPress={handleSubmit} >Add</Button>
      {message !== '' && <Text style={styles.message}>{message}</Text>}

      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {categories.map((cat) => (
            <TouchableOpacity key={cat} style={styles.chip}>
              <Text style={styles.chipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sectionTitle}>Recently Reviewed Shops</Text>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const shopName = item.shop_drinks?.shops?.name;
          const drinkName = item.shop_drinks?.drinks?.name;

          return (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>
                {drinkName ? `${drinkName} @ ${shopName}` : 'Review'}
              </Text>
              <Text style={styles.reviewRating}>⭐ {item.rating}/5</Text>
              {item.comment && (
                <Text style={styles.reviewComment}>{item.comment}</Text>
              )}
              <Text style={styles.reviewDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          );
        }}
      />
      <Button onPress={() => navigation.navigate('InsertShop')}>
        Add review
      </Button>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  categoryContainer: {
    height: 40,
    marginBottom: 8,
  },
  chipRow: {
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FDDDE6',
    borderRadius: 15,
    marginRight: 8,
    alignSelf: 'center',
  },
  chipText: {
    fontSize: 14,
    color: '#D46A92',
    fontWeight: '500',
  },
  message: {
    marginTop: 8,
    fontSize: 16,
    marginBttom: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  shopCard: {
    backgroundColor: '#F9F6F1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
  },
  shopAddress: {
    color: '#555',
    marginTop: 4,
  },
  suggestion: {
    padding: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  reviewCard: {
    backgroundColor: '#F9F6F1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewRating: {
    marginTop: 4,
    fontWeight: '500',
  },
  reviewComment: {
    marginTop: 4,
    fontStyle: 'italic',
    color: '#555',
  },
  reviewDate: {
    marginTop: 6,
    fontSize: 12,
    color: '#999',
  },
});
