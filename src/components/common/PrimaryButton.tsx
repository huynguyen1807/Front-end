import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, style }: PrimaryButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center'
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }]
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  }
});
