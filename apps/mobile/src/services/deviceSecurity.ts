import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const pinKey = (userId: string) =>
  `stockwave.security.${userId}.pin`;

const biometricKey = (userId: string) =>
  `stockwave.security.${userId}.biometrics`;

export async function saveDevicePin(
  userId: string,
  pin: string,
) {
  await SecureStore.setItemAsync(
    pinKey(userId),
    pin,
  );
}

export async function verifyDevicePin(
  userId: string,
  pin: string,
) {
  const storedPin =
    await SecureStore.getItemAsync(
      pinKey(userId),
    );

  return storedPin === pin;
}

export async function hasDevicePin(
  userId: string,
) {
  const storedPin =
    await SecureStore.getItemAsync(
      pinKey(userId),
    );

  return Boolean(storedPin);
}

export async function setDeviceBiometricsEnabled(
  userId: string,
  enabled: boolean,
) {
  await AsyncStorage.setItem(
    biometricKey(userId),
    String(enabled),
  );
}

export async function getDeviceBiometricsEnabled(
  userId: string,
) {
  const value =
    await AsyncStorage.getItem(
      biometricKey(userId),
    );

  return value === 'true';
}

export async function clearDeviceSecurity(
  userId: string,
) {
  await Promise.all([
    SecureStore.deleteItemAsync(
      pinKey(userId),
    ),

    AsyncStorage.removeItem(
      biometricKey(userId),
    ),
  ]);
}