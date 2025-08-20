import { insertReview, RATING_SCALE } from '@cuptrail/core';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import MediaPreview from '../../components/MediaPreview';
import { MEDIA_CONFIG } from '../../constants';
import { uploadMedia } from '../../storage/uploadMedia';

export default function InsertReviewScreen() {
  const params = useLocalSearchParams<{
    shopName: string;
    shopId: string;
    address: string;
    latitude: string;
    longitude: string;
  }>();

  const { shopName, shopId } = params;
  const router = useRouter();

  const [review, setReview] = useState('');
  const [rating, setRating] = useState<string>('');
  const [drink, setDrink] = useState('');
  const [mediaArr, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);

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
      if (
        Number.isNaN(parsedRating) ||
        parsedRating < RATING_SCALE.MIN ||
        parsedRating > RATING_SCALE.MAX
      ) {
        Alert.alert(
          'Invalid rating',
          `Please enter a number between ${RATING_SCALE.MIN} and ${RATING_SCALE.MAX}.`
        );
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
                  router.back();
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
  }, [rating, drink, review, mediaArr, router, shopId, params]);

  const handleMediaUpload = useCallback(async () => {
    try {
      if (mediaArr.length >= MEDIA_CONFIG.MAX_FILES) {
        Alert.alert(
          'Limit reached',
          `You can only upload up to ${MEDIA_CONFIG.MAX_FILES} files.`
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: MEDIA_CONFIG.IMAGE_QUALITY,
        aspect: MEDIA_CONFIG.ASPECT_RATIO,
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
  }, [mediaArr.length]);

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

      <View style={{ marginBottom: mediaArr.length > 0 ? 16 : 0 }}>
        {mediaArr.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previewScrollContainer}
          >
            {mediaArr.map((media: ImagePicker.ImagePickerAsset) => (
              <MediaPreview
                key={media.uri}
                media={media}
                onRemove={() => handleRemoveMedia(media.uri)}
              />
            ))}
          </ScrollView>
        )}
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    color: '#555',
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
  uploadMediaButton: {
    backgroundColor: '#FDDDE6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  uploadMediaButtonText: {
    color: '#D46A92',
    fontWeight: '600',
    fontSize: 14,
  },
  previewScrollContainer: {
    paddingVertical: 7,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  submitButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 3,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  reviewCard: {
    backgroundColor: '#F9F6F1',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  reviewRating: {
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
