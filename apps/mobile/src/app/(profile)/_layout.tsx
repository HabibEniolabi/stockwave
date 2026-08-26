import { Stack } from "expo-router";

export default function PropfileLayout() {
  <Stack
    screenOptions={{
      headerShown: false
    }}
  > 
    <Stack.Screen name="AccountScreen"/>
  </Stack>
}