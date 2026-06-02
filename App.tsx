import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ReduxProvider from "./src/app/providers/ReduxProvider";
import WelcomeScreen from "./src/features/auth/screens/WelcomeScreen";
import { NavigationProvider } from "./src/app/providers/NavigationProvider";
import AppNavigator from "./src/app/AppNavigator";

const Stack = createNativeStackNavigator();

function MainApp() {
  return (
    <NavigationProvider>
      <AppNavigator />
    </NavigationProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ReduxProvider>
        <StatusBar style="dark" translucent={false} />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Main" component={MainApp} />
          </Stack.Navigator>
        </NavigationContainer>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}