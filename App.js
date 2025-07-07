import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { supabase } from './apis/supabase';

export default function App() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      const { data, error } = await supabase.from('shops').select('*');
      if (error) {
        console.error('Error fetching shops:', error);
      } else {
        setShops(data);
      }
      setLoading(false);
    };

    fetchShops();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cup Trail 🧋</Text>
      {loading ? (
        <ActivityIndicator size='large' />
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.shopItem}>
              <Text style={styles.shopName}>{item.name}</Text>
              <Text style={styles.shopAddress}>{item.address}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  shopItem: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shopAddress: {
    fontSize: 14,
    color: '#777',
  },
});
