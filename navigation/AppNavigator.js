import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your screens
import InsertShopScreen from '../screens/insertShopScreen';
// import ShopListScreen from '../screens/ShopListScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="InsertShop">
        <Stack.Screen
          name="InsertShop"
          component={InsertShopScreen}
          options={{ title: 'Add Business' }}
        />
{/* 
        <Stack.Screen
          name="ShopList"
          component={ShopListScreen}
          options={{ title: 'All Shops' }}
        /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
