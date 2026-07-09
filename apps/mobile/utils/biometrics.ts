import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_TOKEN_KEY = 'biometric_token';

export const biometrics = {
  isAvailable: async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  },

  isEnabled: async () => {
    const val = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return val === 'true';
  },

  enable: async (token: string) => {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, token);
  },

  disable: async () => {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
  },

  authenticate: async (): Promise<string | null> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Hesabına giriş yap',
      cancelLabel: 'İptal',
      fallbackLabel: 'Şifre Kullan',
    });
    if (!result.success) return null;
    return await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
  },

  getSupportedTypes: async () => {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  },
};
