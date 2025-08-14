import { getHighlyRatedDrinks } from '@cuptrail/data/drinks';
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useCallback, useState, JSX } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

// --- Types ---
type RootStackParamList = {
  Storefront: { shopName: string; address: string; shopId: string };
  'Add Review': { shopName: string; shopId: string | number };
};

type DrinkItem = {
  id: string | number;
  cover_photo_url?: string | null;
  avg_rating: number;
  drinks: { name: string };
};

export default function StoreFrontScreen(): JSX.Element {
  const route = useRoute<RouteProp<RootStackParamList, 'Storefront'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { shopName, address, shopId } = route.params;
  const [shopAddress, setShopAddress] = useState<string>('');
  const [drinks, setDrinks] = useState<DrinkItem[]>([]);

  useEffect(() => {
    if (address) setShopAddress(address);
    const getDrinks = async () => {
      // console.log(`shopId = ${shopId}`); // Removed for production
      const result = await getHighlyRatedDrinks(shopId);
      // console.log('[StoreFrontScreen] useEffect result:', result); // Removed for production
      if (!result?.success) {
        // console.warn('Error getting ratings:', result?.message); // Removed for production
        return;
      }
      setDrinks(result.data as DrinkItem[]);
    };

    getDrinks();
  }, [address]);

  useFocusEffect(
    useCallback(() => {
      const reloadDrinks = async () => {
        // reload drinks and store details
        const result = await getHighlyRatedDrinks(shopId);
        if (!result?.success) {
          return;
        }
        setDrinks(result.data as DrinkItem[]);
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
      <FlatList<DrinkItem>
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
            {/* <Text style={styles.drinkPrice}>${item.price}</Text> */}
            <Text style={styles.drinkPrice}>⭐ {item.avg_rating}/5</Text>
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
