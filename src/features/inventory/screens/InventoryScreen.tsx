import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from 'components/layout/ScreenContainer';

const inventoryHighlights = [
  { name: 'Rice', amount: '3 kg', status: 'Good' },
  { name: 'Eggs', amount: '12 pcs', status: 'Low' },
  { name: 'Milk', amount: '1 bottle', status: 'Expiring soon' }
];

export function InventoryScreen() {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory overview</Text>
        <Text style={styles.subtitle}>See what is available, low, or near expiry.</Text>
      </View>

      <View style={styles.list}>
        {inventoryHighlights.map((item) => (
          <View key={item.name} style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.rowMeta}>{item.amount}</Text>
            </View>
            <Text style={styles.rowStatus}>{item.status}</Text>
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
  row: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  rowTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700'
  },
  rowMeta: {
    color: '#64748b',
    marginTop: 4
  },
  rowStatus: {
    color: '#0f172a',
    fontWeight: '700'
  }
});
