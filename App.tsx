<<<<<<< HEAD
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ReduxProvider from "./src/app/providers/ReduxProvider";
import WelcomeScreen from "./src/features/auth/screens/WelcomeScreen";
import { NavigationProvider } from "./src/app/providers/NavigationProvider";
import AppNavigator from "./src/app/AppNavigator";
import RegisterScreen from "features/auth/screens/RegisterScreen";

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
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Main" component={MainApp} />
          </Stack.Navigator>
        </NavigationContainer>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}
=======
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ReduxProvider from "./src/app/providers/ReduxProvider";
import LoginScreen from "./src/features/auth/screens/LoginScreen";
import RegisterScreen from "./src/features/auth/screens/RegisterScreen";
import OTPVerificationScreen from "./src/features/auth/screens/OTPVerificationScreen";
import ForgotPasswordScreen from "./src/features/auth/screens/ForgotPasswordScreen";
import { NavigationProvider } from "./src/app/providers/NavigationProvider";
import AppNavigator from "./src/app/AppNavigator";
import AddFoodScreen from "./src/features/inventory/screens/AddFoodScreen";
import UpdateFoodScreen from "./src/features/inventory/screens/UpdateFoodScreen";
import StorageLocationScreen from "./src/features/inventory/screens/StorageLocationScreen";
import FoodDetailScreen from "./src/features/inventory/screens/FoodDetailScreen";

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
            initialRouteName="Login"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="Main" component={MainApp} />
            {/* Food Inventory screens */}
            <Stack.Screen name="AddFood" component={AddFoodScreen} />
            <Stack.Screen name="UpdateFood" component={UpdateFoodScreen} />
            <Stack.Screen name="StorageLocations" component={StorageLocationScreen} />
            <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}
>>>>>>> main
