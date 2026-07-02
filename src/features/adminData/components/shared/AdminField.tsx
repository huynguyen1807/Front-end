import { ReactNode } from "react";
import { Text, View } from "react-native";

import { adminDataStyles as styles } from "../../styles/AdminData.styles";

type AdminFieldProps = {
  label: string;
  children: ReactNode;
};

export default function AdminField({ label, children }: AdminFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}
