import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from 'components/layout/ScreenContainer';

export function ProfileScreen() {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Household profile</Text>
        <Text style={styles.subtitle}>Manage members, preferences, and notification settings.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Current household</Text>
        <Text style={styles.value}>Household A</Text>
        <Text style={styles.meta}>3 members · 1 fridge · 2 storage zones</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: 20
  },
  title: {
    color: '#0f172a',
    fontSize: 26,
    fontWeight: '800'
  },
  subtitle: {
    color: '#64748b',
    fontSize: 15,
    lineHeight: 22
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 8
  },
  label: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  value: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800'
  },
  meta: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20
  }
});
