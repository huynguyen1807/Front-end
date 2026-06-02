import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from 'features/home/screens/HomeScreen';
import { InventoryScreen } from 'features/inventory/screens/InventoryScreen';
import { MealPlanScreen } from 'features/mealPlan/screens/MealPlanScreen';
import { ProfileScreen } from 'features/profile/screens/ProfileScreen';
import { WelcomeScreen } from 'features/welcome/screens/WelcomeScreen';
import type { RootStackParamList } from './navigationTypes';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a'
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700'
        },
        contentStyle: {
          backgroundColor: '#f8fafc'
        }
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: 'Inventory' }} />
      <Stack.Screen name="MealPlan" component={MealPlanScreen} options={{ title: 'Meal Plan' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}
