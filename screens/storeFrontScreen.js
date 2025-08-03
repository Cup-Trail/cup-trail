import { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import { getHighlyRatedDrinks } from '../apis/drinks';

export default function StoreFrontScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { shopName, address, shopId } = route.params;
  const [shopAddress, setShopAddress] = useState('');
  const [drinks, setDrinks] = useState([]);

  useEffect(() => {
    if (address) setShopAddress(address);
    const getDrinks = async () => {
      console.log(`shopId = ${shopId}`);
      const result = await getHighlyRatedDrinks(shopId);
      console.log('[StoreFrontScreen] useEffect result:', result);
      if (!result?.success) {
        console.warn('Error getting ratings:', result?.message);
        return;
      }
      setDrinks(result.data);
    };

    getDrinks();
  }, [address]);

  useFocusEffect(
    useCallback(() => {
      const reloadDrinks = async () => {
        // reload drinks and store details
        const result = await getHighlyRatedDrinks(shopId);
        console.log('[StoreFrontScreen] useFocusEffect result:', result);
        if (!result?.success) {
          console.warn('Error reloading ratings:', result?.message);
          return;
        }
        setDrinks(result.data);
      };
      reloadDrinks();
    }, [shopId])
  );
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.shopTitle}>{shopName}</Text>
      {/* Address */}
      <Text style={styles.address}>{shopAddress}</Text>
      {/* Menu Section */}
      <Text style={styles.sectionTitle}>Popular Drinks</Text>
      <FlatList
        data={drinks}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.drinkCard}>
            {item.cover_photo_url && (
              <Image
                source={{ uri: item.cover_photo_url }}
                style={styles.drinkImage}
                resizeMode="cover"
              />
            )}
            <Text style={styles.drinkName}>{item.drinks.name}</Text>
            {/* <Text style={styles.drinkPrice}>${item.price}</Text> */}
            <Text style={styles.drinkPrice}>⭐ {item.avg_rating}/10</Text>
          </View>
        )}
        showsHorizontalScrollIndicator={false}
      />

      {/* Actions */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Add Review', { shopName, shopId })}
      >
        <Text style={styles.buttonText}>Write a Review</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  address: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#D46A92',
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  container: {
    padding: 20,
    paddingBottom: 60,
    backgroundColor: '#fff',
  },
  drinkCard: {
    backgroundColor: '#F3FBF7',
    padding: 12,
    borderRadius: 10,
    marginRight: 12,
    width: 160,
  },
  drinkImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#eee',
    resizeMode: 'cover',
  },
  drinkName: {
    fontSize: 16,
    fontWeight: '600',
  },
  drinkPrice: {
    fontSize: 14,
    color: '#333',
  },
  drinkTag: {
    fontSize: 12,
    color: '#999',
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  shopTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  shopImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
});
