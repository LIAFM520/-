import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

export default function RootLayout() {
  return (
    <Provider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerShown: false
        }}
      >
        <Stack.Screen name="(tabs)" options={{ title: "" }} />
        <Stack.Screen name="login" options={{ 
          title: "扫码登录",
          headerShown: true,
          headerStyle: { backgroundColor: '#0A0A0F' },
          headerTintColor: '#EAEAEA',
          presentation: 'modal'
        }} />
        <Stack.Screen name="product" options={{ 
          title: "商品详情",
          headerShown: true,
          headerStyle: { backgroundColor: '#0A0A0F' },
          headerTintColor: '#EAEAEA'
        }} />
        <Stack.Screen name="+not-found" options={{ title: "" }} />
      </Stack>
      <Toast />
    </Provider>
  );
}
