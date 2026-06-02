import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ReduxProvider from "./src/app/providers/ReduxProvider";
import { NavigationProvider } from "./src/app/providers/NavigationProvider";
import AppNavigator from "./src/app/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <ReduxProvider>
        <NavigationProvider>
          <StatusBar style="dark" translucent={false} />
          <AppNavigator />
        </NavigationProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}