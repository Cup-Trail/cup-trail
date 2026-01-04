import { useEvent } from 'expo';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

export interface MediaPreviewProps {
  media: ImagePickerAsset;
  onRemove?: () => void;
}

export default function MediaPreview({ media, onRemove }: MediaPreviewProps) {
  // Always call hooks first, before any conditional returns
  const isVideo = media.type === 'video';

  // Always call hooks, even if we don't use them
  const player = useVideoPlayer(media.uri, player => {
    if (player) {
      player.loop = true;
      player.play();
      player.muted = true;
    }
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player?.playing,
  });

  const handlePress = () => {
    if (player) {
      isPlaying ? player.pause() : player.play();
    }
  };

  // Now we can have conditional returns
  if (!media?.uri) return null;

  return (
    <View style={styles.wrapper}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <View style={styles.aspectRatioBox}>
          {isVideo ? (
            <VideoView
              player={player}
              contentFit='cover'
              style={StyleSheet.absoluteFill}
              allowsFullscreen
              allowsPictureInPicture
            />
          ) : (
            <Image source={{ uri: media.uri }} style={styles.image} />
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* ✕ Remove Button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove?.()}
      >
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  aspectRatioBox: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
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
    borderColor: '#D46A92',
    elevation: 2,
    zIndex: 1,
  },
  removeText: {
    color: '#D46A92',
    fontSize: 11,
    fontWeight: 'bold',
  },
  wrapper: {
    position: 'relative',
    marginRight: 10,
  },
});
