import { Image, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { settingsScreenStyles as styles } from "../styles/SettingsScreen.styles";
import { UserProfile } from "../types/settings";
import { COLORS } from "../../../constants/colors";

interface ProfileSectionProps {
  user: UserProfile;
  onEditPress?: () => void;
}

export default function ProfileSection({
  user,
  onEditPress,
}: ProfileSectionProps) {
  return (
    <View style={styles.profileSection}>
      <View style={styles.profileHeader}>
        <Text style={styles.profileTitle}>Hồ sơ</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onEditPress}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Chỉnh sửa</Text>
          <Ionicons name="pencil" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileContent}>
        {user.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={styles.profileAvatar}
          />
        ) : (
          <View style={styles.profileAvatar} />
        )}

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
      </View>
    </View>
  );
}
