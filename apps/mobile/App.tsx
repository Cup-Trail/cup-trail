// react imports
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// screens
import SearchScreen from './app/screens/SearchScreen';
import InsertReview from './app/screens/InsertReviewScreen';
import StorefrontScreen from './app/screens/StorefrontScreen';

const Stack = createNativeStackNavigator();
function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={SearchScreen} />
      <Stack.Screen name="Add Review" component={InsertReview} />
      <Stack.Screen name="Storefront" component={StorefrontScreen} />
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
