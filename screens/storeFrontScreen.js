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
import { fetchHighlyRatedDrinks } from '../apis/drinks';

export default function StoreFrontScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { shopName, address, shopId } = route.params;
  const [shopAddress, setShopAddress] = useState('');
  const [drinks, setDrinks] = useState([]);

  useEffect(() => {
    if (address) setShopAddress(address);
    const fetchDrinks = async () => {
      console.log(`shopId = ${shopId}`);
      const result = await fetchHighlyRatedDrinks(shopId);
      console.log('[StoreFrontScreen] useEffect result:', result);
      if (!result?.success) {
        console.warn('Error fetching ratings:', result?.message);
        return;
      }
      setDrinks(result.data);
    };

    fetchDrinks();
  }, [address]);

  useFocusEffect(
    useCallback(() => {
      const refetchDrinks = async () => {
        // re-fetch drinks and store details
        const result = await fetchHighlyRatedDrinks(shopId);
        console.log('[StoreFrontScreen] useFocusEffect result:', result);
        if (!result?.success) {
          console.warn('Error reloading ratings:', result?.message);
          return;
        }
        setDrinks(result.data);
      };
      refetchDrinks();
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
            <Text style={styles.drinkName}>{item.drinks.name}</Text>
            {/* <Text style={styles.drinkTag}>{item.tags?.join(', ')}</Text> */}
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
  container: {
    padding: 20,
    paddingBottom: 60,
    backgroundColor: '#fff',
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
  address: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  drinkCard: {
    backgroundColor: '#F3FBF7',
    padding: 12,
    borderRadius: 10,
    marginRight: 12,
    width: 160,
  },
  drinkName: {
    fontSize: 16,
    fontWeight: '600',
  },
  drinkTag: {
    fontSize: 12,
    color: '#999',
    marginVertical: 4,
  },
  drinkPrice: {
    fontSize: 14,
    color: '#333',
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
});
