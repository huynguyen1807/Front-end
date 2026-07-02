import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
import NotificationScreen from "./src/features/notifications/screens/NotificationScreen";
import { FamilyCloudScreen } from "./src/features/familyCloud";
import { SubscriptionScreen } from "./src/features/subscription";

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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
              {/* Notifications screen */}
              <Stack.Screen name="Notifications" component={NotificationScreen} />
              {/* Family Cloud screen */}
              <Stack.Screen name="FamilyCloud" component={FamilyCloudScreen} />
              <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
