import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from 'components/common/PrimaryButton';
import { ScreenContainer } from 'components/layout/ScreenContainer';
import type { RootStackParamList } from 'app/navigation/navigationTypes';
import { apiClient } from 'services/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const quickCards = [
  { label: 'Inventory', route: 'Inventory' as const, value: '24 items' },
  { label: 'Meal Plan', route: 'MealPlan' as const, value: 'This week' },
  { label: 'Profile', route: 'Profile' as const, value: 'Household A' }
];

export function HomeScreen({ navigation }: Props) {
  const [backendStatus, setBackendStatus] = useState('Checking backend connection...');

  useEffect(() => {
    let isMounted = true;

    apiClient
      .getHealth()
      .then((response) => {
        if (isMounted) {
          setBackendStatus(`${response.service} is ${response.status} v${response.version}`);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBackendStatus('Unable to reach backend');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.kicker}>Dashboard</Text>
        <Text style={styles.title}>What do you want to manage today?</Text>
        <Text style={styles.backendStatus}>{backendStatus}</Text>
      </View>

      <View style={styles.cards}>
        {quickCards.map((card) => (
          <View key={card.label} style={styles.card}>
            <Text style={styles.cardLabel}>{card.label}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
            <PrimaryButton label={`Open ${card.label}`} onPress={() => navigation.navigate(card.route)} style={styles.cardButton} />
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: 20
  },
  kicker: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    maxWidth: 320
  },
  backendStatus: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '700'
  },
  cards: {
    gap: 14
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    gap: 10
  },
  cardLabel: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800'
  },
  cardValue: {
    color: '#64748b',
    fontSize: 14
  },
  cardButton: {
    marginTop: 4
  }
});
