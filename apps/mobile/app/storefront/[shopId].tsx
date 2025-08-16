import { getHighlyRatedDrinks } from '@cuptrail/core';
import type { ShopDrinkRow } from '@cuptrail/core';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export default function StoreFrontScreen() {
  const params = useLocalSearchParams<{
    shopName: string;
    address: string;
    shopId: string;
    latitude: string;
    longitude: string;
    refresh?: string;
  }>();

  const { shopName, address, shopId, latitude, longitude, refresh } = params;
  const router = useRouter();
  const [shopAddress, setShopAddress] = useState<string>('');
  const [drinks, setDrinks] = useState<ShopDrinkRow[]>([]);

  useEffect(() => {
    if (address) setShopAddress(address);
    const getDrinks = async () => {
      const result = await getHighlyRatedDrinks(shopId);
      if (!result?.success) {
        return;
      }
      setDrinks(result.data as ShopDrinkRow[]);
    };

    getDrinks();
  }, [address, shopId]);
  useFocusEffect(
    useCallback(() => {
      const reloadDrinks = async () => {
        // reload drinks and store details
        const result = await getHighlyRatedDrinks(shopId);
        if (!result?.success) {
          return;
        }
        setDrinks(result.data as ShopDrinkRow[]);
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
      <FlatList<ShopDrinkRow>
        data={drinks}
        horizontal
        keyExtractor={item => String(item.id)}
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
            <Text style={styles.drinkPrice}>⭐ {item.avg_rating}/5</Text>
          </View>
        )}
        showsHorizontalScrollIndicator={false}
      />

      {/* Actions */}
      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({
            pathname: '/review/[shopId]',
            params: { shopName, shopId, address, latitude, longitude },
          })
        }
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
});
