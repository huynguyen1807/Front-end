import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from 'components/layout/ScreenContainer';

const mealPlans = [
  { day: 'Mon', meal: 'Chicken rice bowl' },
  { day: 'Tue', meal: 'Vegetable pasta' },
  { day: 'Wed', meal: 'Fried rice with egg' }
];

export function MealPlanScreen() {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Meal plan</Text>
        <Text style={styles.subtitle}>A simple weekly preview to start the planning flow.</Text>
      </View>

      <View style={styles.list}>
        {mealPlans.map((item) => (
          <View key={item.day} style={styles.card}>
            <Text style={styles.day}>{item.day}</Text>
            <Text style={styles.meal}>{item.meal}</Text>
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
  list: {
    gap: 12
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 6
  },
  day: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  meal: {
    color: '#475569',
    fontSize: 16
  }
});
