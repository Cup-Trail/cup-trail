import { insertReview } from '@cuptrail/data/reviews';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import MediaPreview from '../components/MediaPreview';
import { uploadMedia } from '../storage/uploadMedia';
// import { getCurrentUserId } from '../apis/users';

type RouteParams = {
  shopName: string;
  shopId: string;
};

export default function InsertReviewScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const [review, setReview] = useState('');
  const [rating, setRating] = useState<string>('');
  const [drink, setDrink] = useState('');
  const [mediaArr, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const { shopName, shopId } = (route.params as RouteParams) || {
    shopName: '',
    shopId: '',
  };
  const clearForm = () => {
    setDrink('');
    setRating('');
    setReview('');
    setMedia([]);
  };

  const handleSubmit = useCallback(async () => {
    try {
      const parsedRating = parseFloat(rating);
      if (!drink.trim()) {
        Alert.alert('Invalid drink', 'Please enter a valid drink.');
        return;
      }
      if (Number.isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
        Alert.alert('Invalid rating', 'Please enter a number between 0 and 5.');
        return;
      }
      if (!review.trim()) {
        Alert.alert('Invalid review', 'Please enter a valid review.');
        return;
      }

      const uploadedUrls: string[] = [];
      for (const media of mediaArr) {
        try {
          const result = await uploadMedia({
            uri: media.uri,
            mimeType: media.mimeType ?? undefined,
            fileName: media.fileName ?? undefined,
          });
          if (result.success) {
            uploadedUrls.push(result.url);
          } else {
            // Silently handle upload failure
            // Could add user notification here if needed
          }
        } catch (error) {
          // Log for debugging in development
          if (__DEV__) {
            console.error('Media upload failed:', error);
          }

          // Show user-friendly error message
          Alert.alert(
            'Upload Failed',
            'Failed to upload media. Please try again.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      }

      try {
        const result = await insertReview(
          shopId,
          drink.trim(),
          parsedRating,
          review.trim(),
          uploadedUrls.length > 0 ? uploadedUrls : undefined
        );

        if (result?.success) {
          Alert.alert(
            'Success',
            '✅ Review added successfully!',
            [
              {
                text: 'OK',
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

        Alert.alert('Error', result?.message || 'Something went wrong.');
      } catch (error) {
        // Log for debugging in development
        if (__DEV__) {
          console.error('Review submission failed:', error);
        }

        Alert.alert('Error', 'Failed to submit review. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong.');
    }
  }, [rating, drink, review, mediaArr, navigation, shopId]);

  const handleMediaUpload = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ['images', 'videos'],
      });

      if (!result.canceled) {
        let duplicateDetected = false;
        setMedia((prev: ImagePicker.ImagePickerAsset[]) => {
          const existing = new Set(
            prev.map((m: ImagePicker.ImagePickerAsset) => m.assetId || m.uri)
          );
          const newItems = result.assets.filter(
            (m: ImagePicker.ImagePickerAsset) => {
              const id = m.assetId || m.uri;
              if (existing.has(id)) {
                duplicateDetected = true;
                return false;
              }
              return true;
            }
          );
          if (duplicateDetected) {
            Alert.alert(
              'Duplicate Media',
              'You have already selected one or more of these items.'
            );
          }
          return [...prev, ...newItems];
        });
      }
    } catch (error) {
      // Log for debugging in development
      if (__DEV__) {
        console.error('Image picker failed:', error);
      }

      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  }, []);

  const handleRemoveMedia = (uri: string) => {
    setMedia((prev: ImagePicker.ImagePickerAsset[]) =>
      prev.filter((media: ImagePicker.ImagePickerAsset) => media.uri !== uri)
    );
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
        editable={false}
      />
      <Text style={styles.label}>Rating</Text>
      <TextInput
        style={styles.textArea}
        placeholder="0 - 5"
        keyboardType="decimal-pad"
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
        style={styles.uploadMediaButton}
        onPress={handleMediaUpload}
      >
        <Text style={styles.uploadMediaButtonText}>Upload Media</Text>
      </TouchableOpacity>
      <View
        style={[
          styles.previewContainer,
          { marginBottom: mediaArr.length > 0 ? 20 : 0 },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previewContainer}
        >
          {mediaArr.map((media: ImagePicker.ImagePickerAsset) => (
            <MediaPreview
              key={media.uri}
              media={media}
              onRemove={() => handleRemoveMedia(media.uri)}
            />
          ))}
        </ScrollView>
      </View>
      <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
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
  label: {
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 16,
  },
  previewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
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
  uploadMediaButton: {
    backgroundColor: '#FDDDE6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  uploadMediaButtonText: {
    color: '#D46A92',
    fontWeight: '600',
    fontSize: 14,
  },
});
