import { NavigationContainer } from '@react-navigation/native';
import { ReactNode } from 'react';

import { AppNavigator } from '../navigation/AppNavigator';

type AppProviderProps = {
  children?: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return <NavigationContainer>{children ?? <AppNavigator />}</NavigationContainer>;
}
