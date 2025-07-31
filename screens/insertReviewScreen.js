// react & expo
import {
  View,
  Text,
  Alert,
  Image,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@react-navigation/elements';
import { useRoute } from '@react-navigation/native';

// backend
import { uploadPhoto } from '../apis/storage';
import { insertReview } from '../apis/reviews';
// import { getCurrentUserId } from '../apis/users';

export default function InsertReviewScreen() {
  const route = useRoute();

  const [review, setReview] = useState('');
  const [rating, setRating] = useState(null);
  const [drink, setDrink] = useState('');
  const [photos, setPhotos] = useState([]);

  const { shopName, shopId } = route.params;
  const clearForm = () => {
    setDrink('');
    setRating(null);
    setReview('');
    setPhotos([]);
  };

  const handleSubmit = async () => {
    try {
      const parsedRating = parseFloat(rating);
      if (!drink) {
        Alert.alert('Invalid drink', 'Please enter a valid drink.');
        return;
      }
      if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 10) {
        Alert.alert(
          'Invalid rating',
          'Please enter a number between 0 and 10.'
        );
        return;
      }
      if (!review) {
        Alert.alert('Invalid review', 'Please enter a valid review.');
        return;
      }

      let uploadedUrls = [];
      for (const photo of photos) {
        const upload = await uploadPhoto(photo);
        if (upload.success) {
          uploadedUrls.push(upload.url);
        } else {
          // console.error('Error', JSON.stringify(upload));
          return;
        }
      }

      const result = await insertReview(
        shopId,
        drink,
        parsedRating,
        review,
        uploadedUrls[0] || null
      );

      if (result?.success) {
        Alert.alert('Success', '✅ Review added successfully!');
        clearForm();
        return;
      }
    } catch (err) {
      Alert.alert('Error', result.message);
    }
  };

  const handleImageUpload = async () => {
    try {
      // const userResult = await getCurrentUserId();

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ['images', 'videos'],
        quality: 1,
      });

      if (!result.canceled) {
        setPhotos((prev) => [...prev, ...result.assets]);
      }
    } catch (err) {
      console.error('Image picker failed:', err);
    }
  };

  const handleRemovePhoto = (uri) => {
    setPhotos((prev) => prev.filter((photo) => photo !== uri));
  };

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

      <TouchableOpacity style={styles.photoButton} onPress={handleImageUpload}>
        <Text style={styles.photoButtonText}>📷 Add Photo</Text>
      </TouchableOpacity>
      <View style={styles.previewContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previewContainer}
        >
          {photos.map((photo) => (
            <View key={photo.uri} style={styles.imageWrapper}>
              <Image source={{ uri: photo.uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemovePhoto(photo.uri)}
              >
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

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
    textAlignVertical: 'top',
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
  previewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
    elevation: 2,
  },
  removeText: {
    color: '#D46A92',
    fontSize: 14,
    fontWeight: 'bold',
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
