// src/app/(security)/_layout.tsx

import { Stack } from 'expo-router';

export default function SecurityLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="CreatePinScreen"
        options={{
          animation: 'fade',
        }}
      />
    </Stack>
  );
}