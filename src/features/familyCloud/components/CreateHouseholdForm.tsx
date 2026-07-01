import { Text, TextInput, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { familyCloudStyles as styles } from "../styles/FamilyCloudScreen.styles";

interface CreateHouseholdFormProps {
  householdName: string;
  saving: boolean;
  onChangeHouseholdName: (value: string) => void;
  onSubmit: () => void;
}

export default function CreateHouseholdForm({
  householdName,
  saving,
  onChangeHouseholdName,
  onSubmit,
}: CreateHouseholdFormProps) {
  return (
    <View style={styles.formBox}>
      <Text style={styles.sectionTitle}>Tạo Family Cloud</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={householdName}
          onChangeText={onChangeHouseholdName}
          placeholder="VD: Nhà An"
          placeholderTextColor={COLORS.onSurfaceVariant}
          style={styles.input}
        />
        <TouchableOpacity
          onPress={onSubmit}
          disabled={saving}
          style={[styles.primaryButton, saving && styles.disabled]}
        >
          <Text style={styles.primaryButtonText}>Tạo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
