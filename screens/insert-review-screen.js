// react & expo
import {
  View,
  Text,
  Alert,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@react-navigation/elements';
import { useRoute, useNavigation } from '@react-navigation/native';
// custom component
import MediaPreview from '../components/media-preview';
// backend
import { uploadMedia } from '../apis/storage';
import { insertReview } from '../apis/reviews';
// import { getCurrentUserId } from '../apis/users';

export default function InsertReviewScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const [review, setReview] = useState('');
  const [rating, setRating] = useState(null);
  const [drink, setDrink] = useState('');
  const [mediaArr, setMedia] = useState([]);

  const { shopName, shopId } = route.params;
  const clearForm = () => {
    setDrink('');
    setRating(null);
    setReview('');
    setMedia([]);
  };

  const handleSubmit = async () => {
    try {
      console.log('handle submit');
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
      for (const media of mediaArr) {
        console.log('media', media);
        try {
          const upload = await uploadMedia(media);
          console.log('upload', upload);
          if (upload.success) {
            uploadedUrls.push(upload.url);
          }
          // TODO: error handling
        } catch (err) {
          console.error('Calling uploadMedia failed', err);
        }
      }
      console.log('uploadedUrls:', uploadedUrls);
      const result = await insertReview(
        shopId,
        drink,
        parsedRating,
        review,
        uploadedUrls || null
      );

      if (result?.success) {
        Alert.alert(
          'Success',
          '✅ Review added successfully!',
          [
            {
              text: 'OK',
              // navigate back to storefront screen
              onPress: () => {
                clearForm();
                navigation.goBack();
              },
            },
          ],
          { cancelable: false }
        );
        return;
      }
    } catch (err) {
      Alert.alert('Error', result.message);
    }
  };

  const handleMediaUpload = async () => {
    try {
      // const userResult = await getCurrentUserId();

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ['images', 'videos'],
        quality: 1,
      });

      if (!result.canceled) {
        let duplicateDetected = false;

        setMedia((prev) => {
          const existingPhotoIds = new Set(prev.map((media) => media.assetId));
          const newMedia = result.assets.filter((media) => {
            if (existingPhotoIds.has(media.assetId)) {
              duplicateDetected = true;
              return false;
            }
            return true;
          });
          if (duplicateDetected) {
            Alert.alert(
              'Duplicate Media',
              'You have already selected one or more of these photos/videos.'
            );
          }
          return [...prev, ...newMedia];
        });
      }
    } catch (err) {
      console.error('Image picker failed:', err);
    }
  };

  const handleRemoveMedia = (uri) => {
    setMedia((prev) => prev.filter((media) => media.uri !== uri));
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

      <TouchableOpacity style={styles.photoButton} onPress={handleMediaUpload}>
        <Text style={styles.photoButtonText}>Upload Media</Text>
      </TouchableOpacity>
      <View style={styles.previewContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previewContainer}
        >
          {mediaArr.map((media) => (
            <MediaPreview
              key={media.uri}
              media={media}
              onRemove={handleRemoveMedia}
            />
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
  buttonGroup: {
    gap: 12,
  },
  container: {
    padding: 24,
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: '#F3FBF7',
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 16,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  imageWrapper: {
    position: 'relative',
  },
  mediaPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  photoButton: {
    backgroundColor: '#FDDDE6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 5,
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
    marginBottom: 10,
    marginTop: 10,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#D46A92', // or '#000' for a neutral black outline
    elevation: 2,
    zIndex: 1,
  },

  removeText: {
    color: '#D46A92',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    color: '#555',
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
});
