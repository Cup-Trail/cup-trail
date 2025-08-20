import type {
  CategoryRow,
  Prediction,
  ReviewRow,
  ShopRow,
} from '@cuptrail/core';
import {
  getOrInsertShop,
  getRecentReviews,
  getCategories,
  getShopsByCategorySlug,
} from '@cuptrail/core';
import {
  getAutocomplete,
  getPlaceDetails,
  extractLocationData,
} from '@cuptrail/utils';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

export default function SearchScreen() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [name, setName] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [activeField, setActiveField] = useState<'name' | null>(null);
  const [categoryShops, setCategoryShops] = useState<ShopRow[]>([]);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(
    null
  );
  // dismiss keyboard and suggestions when tapping outside
  const dismissKeyboardAndSuggestions = () => {
    Keyboard.dismiss();
    setSuggestions([]);
    setActiveField(null);
  };

  // handle input blur (when input loses focus)
  const handleInputBlur = () => {
    // clear suggestions immediately on blur
    setSuggestions([]);
    setActiveField(null);
  };

  const handleAutocomplete = async (input: string): Promise<void> => {
    if (!input) {
      setSuggestions([]);
      setName('');
      return;
    }

    try {
      const predictions = await getAutocomplete(input);
      setSuggestions(predictions);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = async (
    suggestion: Prediction
  ): Promise<void> => {
    try {
      const data = await getPlaceDetails(suggestion.place_id);

      if (!data) {
        console.error('No place details returned');
        return;
      }

      const locationData = extractLocationData(data);

      if (!locationData) {
        console.error('Invalid location data');
        return;
      }

      const { name: placeName, address, latitude, longitude } = locationData;

      if (activeField === 'name' && placeName) setName(placeName);

      if (
        activeField === 'name' &&
        placeName &&
        address &&
        latitude &&
        longitude
      ) {
        const result = await getOrInsertShop(
          placeName,
          address,
          latitude,
          longitude
        );

        if (result?.success && result.data?.id) {
          const shopId = result.data.id;
          // dismiss keyboard and suggestions before navigation
          dismissKeyboardAndSuggestions();
          router.push({
            pathname: '/storefront/[shopId]',
            params: {
              shopId: String(shopId),
              shopName: placeName,
              address: address,
              latitude: String(latitude),
              longitude: String(longitude),
            },
          });
        }
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadReviews = async () => {
        const result = await getRecentReviews();
        if (result?.success) {
          setReviews(result.data);
          setName('');
          setSuggestions([]);
        }
      };
      loadReviews();
      const loadCategories = async () => {
        const result = await getCategories();
        if (result?.success) {
          setCats(result.data);
        }
      };
      loadCategories();
    }, [])
  );

  return (
    <View style={styles.searchWrapper}>
      <TextInput
        style={styles.searchBar}
        onFocus={() => {
          setName('');
        }}
        onChangeText={(text: string) => {
          setName(text);
          setActiveField('name');
          handleAutocomplete(text);
        }}
        onBlur={handleInputBlur}
        placeholder="Search shops, drinks, or cities..."
        value={name}
      />
      {suggestions.length > 0 && (
        <>
          {/* transparent overlay to dismiss suggestions when tapping outside */}
          <TouchableWithoutFeedback onPress={() => setSuggestions([])}>
            <View style={styles.suggestionsOverlay} />
          </TouchableWithoutFeedback>

          {/* suggestions dropdown */}
          <View style={styles.suggestionsDropdown}>
            <FlatList<Prediction>
              keyboardShouldPersistTaps="handled"
              data={suggestions}
              keyExtractor={item => item.place_id}
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
        </>
      )}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {cats.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={styles.chip}
              onPress={async () => {
                if (selectedCategory?.id === cat.id) {
                  setSelectedCategory(null);
                  setCategoryShops([]);
                  return;
                }
                const res = await getShopsByCategorySlug(cat.slug);
                if (res.success) {
                  setCategoryShops(res.data);
                  setSelectedCategory(cat);
                }
              }}
            >
              <Text style={styles.chipText}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedCategory ? (
        <>
          <Text style={styles.sectionTitle}>
            {`Shops for ${selectedCategory.label}`}
          </Text>
          <ScrollView
            style={styles.reviewsContainer}
            showsVerticalScrollIndicator={true}
          >
            {categoryShops.length === 0 ? (
              <Text>No shops found.</Text>
            ) : (
              categoryShops.map(s => (
                <View key={String(s.id)} style={styles.reviewCard}>
                  <Text style={styles.reviewTitle}>{s.name}</Text>
                  {s.address ? (
                    <Text style={styles.reviewComment}>{s.address}</Text>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Recently reviewed shops</Text>
          <ScrollView
            style={styles.reviewsContainer}
            showsVerticalScrollIndicator={true}
          >
            {reviews.map(item => {
              const shopName = item.shop_drinks?.shops?.name;
              const drinkName = item.shop_drinks?.drinks?.name;

              return (
                <View key={String(item.id)} style={styles.reviewCard}>
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
            })}
          </ScrollView>
        </>
      )}
    </View>
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
    marginBottom: 15,
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
  suggestionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 5,
  },
  suggestionText: {
    fontSize: 15,
    color: '#333',
  },
  reviewsContainer: {
    maxHeight: 550,
  },
});
