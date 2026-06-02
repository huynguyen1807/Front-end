import { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

type ScreenContainerProps = {
  children: ReactNode;
};

export function ScreenContainer({ children }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  container: {
    flex: 1,
    padding: 20
  }
});
