import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ReduxProvider from "./src/app/providers/ReduxProvider";
import MainLayout from "./src/app/MainLayout";

export default function App() {
  return (
    <SafeAreaProvider>
      <ReduxProvider>
        <StatusBar style="dark" translucent={false} />
        <MainLayout />
      </ReduxProvider>
    </SafeAreaProvider>
  );
}