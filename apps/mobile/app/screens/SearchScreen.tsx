// react
import {
  View,
  Text,
  FlatList,
  Keyboard,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// backend
import { getOrInsertShop } from '@cuptrail/data/shops';
import { getRecentReviews } from '@cuptrail/data/reviews';

// mock data for now
const categories = ['Matcha', 'Boba', 'Coffee', 'Milk Tea', 'Fruit Tea'];

export default function SearchScreen() {
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const navigation = useNavigation();

  const getAutocomplete = async (input) => {
    if (!input) {
      setSuggestions([]);
      setName('');
      return;
    }

    try {
      const response = await fetch(
        `${
          process.env.EXPO_PUBLIC_SUPABASE_URL
        }/functions/v1/maps?type=autocomplete&input=${encodeURIComponent(
          input
        )}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      );
      console.log(response);
      const json = await response.json();

      if (json.predictions) {
        setSuggestions(json.predictions);
      } else {
        console.warn('No predictions returned from edge function');
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Autocomplete fetch error:', err);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    try {
      const response = await fetch(
        `${
          process.env.EXPO_PUBLIC_SUPABASE_URL
        }/functions/v1/maps?type=details&place_id=${encodeURIComponent(
          suggestion.place_id
        )}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const { name, formatted_address, geometry } = data.result || {};
        const lat = geometry?.location?.lat;
        const lng = geometry?.location?.lng;
        console.log(formatted_address);

        if (activeField === 'name' && name) setName(name);
        if (name && formatted_address && lat && lng) {
          const result = await getOrInsertShop(
            name,
            formatted_address,
            lat,
            lng
          );
          if (result.success) {
            console.log('Shop row:', result.data);
          } else {
            console.warn('Failed to get or create shop:', result.message);
          }
          navigation.navigate('Storefront', {
            shopName: name,
            address: formatted_address,
            shopId: result.data.id,
          });
        }
      } else {
        console.warn('Place Details failed:', data.status);
      }
    } catch (error) {
      console.error('Failed to get place details:', error);
    }
    setSuggestions([]);
  };
  useEffect(() => {
    const getReviews = async () => {
      const result = await getRecentReviews();
      console.log('[SearchScreen] useEffect result:', result);
      if (!result?.success) {
        console.warn('Error getting reviews:', result?.message);
        return;
      }
      setReviews(result.data);
    };
    getReviews();
  }, []);
  useFocusEffect(
    useCallback(() => {
      const reloadReviews = async () => {
        const result = await getRecentReviews();
        console.log('[SearchScreen] useFocusEffect result:', result);
        if (!result?.success) {
          console.warn('Error reloading reviews:', result?.message);
          return;
        }
        setReviews(result.data);
      };
      reloadReviews();
    }, [])
  );
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        setSuggestions([]);
      }}
    >
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchBar}
          onFocus={() => {
            setName('');
          }}
          onChangeText={(text) => {
            setName(text);
            setActiveField('name');
            getAutocomplete(text);
          }}
          placeholder="Search shops, drinks, or cities..."
          value={name}
        />
        {suggestions.length > 0 && (
          <View style={styles.suggestionsDropdown}>
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestion}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Text style={styles.suggestionText}>{item.description}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
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

        <Text style={styles.sectionTitle}>Recently reviewed shops</Text>
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
      </View>
    </TouchableWithoutFeedback>
  );
}
const styles = StyleSheet.create({
  categoryContainer: {
    height: 40,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FDDDE6',
    borderRadius: 15,
    marginRight: 8,
    alignSelf: 'center',
  },
  chipRow: {
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  chipText: {
    fontSize: 14,
    color: '#D46A92',
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: '#F9F6F1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  reviewRating: {
    marginTop: 4,
    fontWeight: '500',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
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
  searchWrapper: {
    zIndex: 10,
    position: 'relative',
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestion: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 61,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    maxHeight: 250,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  suggestionText: {
    fontSize: 15,
    color: '#333',
  },
});
