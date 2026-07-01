import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { familyCloudStyles as styles } from "../styles/FamilyCloudScreen.styles";
import { ROLE_LABEL } from "../types/constants";
import { MyHousehold } from "../types/familyCloud";

interface HouseholdSelectorProps {
  households: MyHousehold[];
  selectedHouseholdId: string;
  onSelectHousehold: (householdId: string) => void;
}

export default function HouseholdSelector({
  households,
  selectedHouseholdId,
  onSelectHousehold,
}: HouseholdSelectorProps) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Family Cloud của bạn</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.householdRow}>
          {households.map((item) => {
            const active = item.household._id === selectedHouseholdId;
            return (
              <TouchableOpacity
                key={item.membershipId}
                onPress={() => onSelectHousehold(item.household._id)}
                style={[styles.householdChip, active && styles.householdChipActive]}
              >
                <Text style={[styles.householdName, active && styles.householdNameActive]}>
                  {item.household.householdName}
                </Text>
                <Text style={[styles.householdRole, active && styles.householdRoleActive]}>
                  {ROLE_LABEL[item.role]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
