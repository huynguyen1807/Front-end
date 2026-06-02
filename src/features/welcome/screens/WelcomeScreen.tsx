import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from 'components/common/PrimaryButton';
import { ScreenContainer } from 'components/layout/ScreenContainer';
import type { RootStackParamList } from 'app/navigation/navigationTypes';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.badge}>Smart Household Food Management</Text>
        <Text style={styles.title}>Track food, plan meals, reduce waste.</Text>
        <Text style={styles.description}>
          A clean Expo starter for managing inventory, meal plans, shopping lists, and household members.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Go to Dashboard" onPress={() => navigation.replace('Home')} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: 12
  },
  badge: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  title: {
    color: '#0f172a',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    maxWidth: 320
  },
  description: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 340
  },
  actions: {
    paddingBottom: 12
  }
});
