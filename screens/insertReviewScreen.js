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
import { useState, useEffect } from 'react';
import { Button } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
// backend
import { GOOGLE_API_KEY } from '@env';
import { insertShop } from '../apis/shops';
import { fetchRecentReviews } from '../apis/reviews';

export default function InsertReviewScreen() {
  const [review, setReview] = useState('');
  const [drink, setDrink] = useState('');

  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Your Review</Text>
      <Text style={styles.subtitle}>
        Track your favorite drinks from each shop!
      </Text>
      <Text style={styles.label}>Drink</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={5}
        placeholder="Name of Drink"
        value={drink}
        onChangeText={setDrink}
      />
      <Text style={styles.label}>Your Review</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={5}
        placeholder="Write your thoughts here..."
        value={review}
        onChangeText={setReview}
      />

      <TouchableOpacity
        style={styles.photoButton}
        onPress={() => console.log('TODO: Add image picker logic')}
      >
        <Text style={styles.photoButtonText}>📷 Add Photo</Text>
      </TouchableOpacity>

      <View style={styles.buttonGroup}>
        <Button title="Add Review" >Submit</Button>
        {/* Add more buttons/screens later like Favorites */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: '#F3FBF7',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 16,
  },

  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top', // ✅ aligns text at the top of multiline field
    fontSize: 15,
    backgroundColor: '#fff',
    marginBottom: 16,
  },

  photoButton: {
    backgroundColor: '#FDDDE6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 32,
  },

  photoButtonText: {
    color: '#D46A92',
    fontWeight: '600',
    fontSize: 14,
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
