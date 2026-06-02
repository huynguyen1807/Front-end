import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ReduxProvider from "./src/app/providers/ReduxProvider";
import HomeScreen from "./src/features/home/screens/HomeScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <ReduxProvider>
        <StatusBar style="dark" translucent={false} />
        <HomeScreen />
      </ReduxProvider>
    </SafeAreaProvider>
  );
}