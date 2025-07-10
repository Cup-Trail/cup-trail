import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your screens
import InsertShopScreen from '../screens/insertShopScreen';
import SearchScreen from '../screens/searchScreen';
// import HomeScreen from '../screens/homeScreen';
const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Search">
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: 'CupTrail' }}
        />
        <Stack.Screen
          name="InsertShop"
          component={InsertShopScreen}
          options={{ title: 'Add Shop' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
