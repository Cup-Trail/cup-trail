// screens/SearchScreen.js

import React, { useState, useEffect } from 'react';
import { fetchRecentReviews } from '../apis/reviews';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const categories = ['Matcha', 'Boba', 'Coffee', 'Milk Tea', 'Fruit Tea'];

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [reviews, setReviews] = useState([]);

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

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search shops, drinks, or cities..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

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
