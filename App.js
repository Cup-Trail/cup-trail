// react imports
import * as React from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// screens
import SearchScreen from './screens/searchScreen';
import InsertShop from './screens/insertShopScreen';

const Stack = createNativeStackNavigator();
function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={SearchScreen} />
      <Stack.Screen name="InsertShop" component={InsertShop} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}
