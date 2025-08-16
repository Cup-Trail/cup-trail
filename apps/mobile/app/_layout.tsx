import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Stack.Screen
        name="storefront/[shopId]"
        options={{
          title: 'Storefront',
        }}
      />
      <Stack.Screen
        name="review/[shopId]"
        options={{
          title: 'Add Review',
        }}
      />
    </Stack>
  );
}
