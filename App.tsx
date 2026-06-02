import 'react-native-gesture-handler';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './src/app/providers/AppProvider';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
