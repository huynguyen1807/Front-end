import { ReactNode } from "react";
import { Text, View } from "react-native";

import { plannerStyles as styles } from "../../styles/PlannerScreen.styles";

type FieldProps = {
  label: string;
  children: ReactNode;
};

export default function Field({ label, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}
