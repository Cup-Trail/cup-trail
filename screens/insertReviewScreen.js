// react
import {
  View,
  Text,
  Alert,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { Button } from '@react-navigation/elements';
import { useRoute, useNavigation } from '@react-navigation/native';
import { insertReview } from '../apis/reviews';

export default function InsertReviewScreen() {
  const route = useRoute();

  const [review, setReview] = useState('');
  const [rating, setRating] = useState(null);
  const [drink, setDrink] = useState('');

  const { shopName, shopId } = route.params;
  const clearForm = () => {
    setDrink('');
    setRating(null);
    setReview('');
  };
  const handleSubmit = async () => {
    const parsedRating = parseFloat(rating);
    if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 10) {
      Alert.alert('Invalid rating', 'Please enter a number between 0 and 10.');
      return;
    }
    if (!review) {
      Alert.alert('Invalid review', 'Please enter a valid review.');
      return;
    }
    if (!drink) {
      Alert.alert('Invalid drink', 'Please enter a valid drink.');
      return;
    }
    const result = await insertReview(shopId, drink, parsedRating, review);

    if (result?.success) {
      Alert.alert('Success', '✅ Review added successfully!');
      clearForm();
      return;
    }

    Alert.alert('Error', result.message);
  };

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
      <Text style={styles.label}>Shop</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={5}
        placeholder="Name of Shop"
        value={shopName}
      />
      <Text style={styles.label}>Rating</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={5}
        placeholder="0 - 10"
        value={rating}
        onChangeText={setRating}
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
        <Button title="Add Review" onPress={handleSubmit}>
          Submit
        </Button>
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
