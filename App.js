// react imports
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// screens
import SearchScreen from './screens/searchScreen';
import InsertReview from './screens/insertReviewScreen';
import StoreFrontScreen from './screens/storeFrontScreen';

const Stack = createNativeStackNavigator();
function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={SearchScreen} />
      <Stack.Screen name="Add Review" component={InsertReview} />
      <Stack.Screen name="Storefront" component={StoreFrontScreen} />
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
