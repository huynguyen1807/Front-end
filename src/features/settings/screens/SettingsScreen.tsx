import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import BottomNavbar from "../../../components/layout/BottomNavbar";
import ScreenContainer from "../../../components/layout/ScreenContainer";
import TopNavbar from "../../../components/layout/TopNavbar";
import { COLORS } from "../../../constants/colors";

import ProfileSection from "../components/ProfileSection";
import SettingsItem from "../components/SettingsItem";
import SettingsToggle from "../components/SettingsToggle";
import SectionHeader from "../components/SectionHeader";
import { settingsScreenStyles as styles } from "../styles/SettingsScreen.styles";
import { UserProfile } from "../types/settings";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<"vi" | "en">("vi");

  const [user, setUser] = useState<UserProfile>({
    name: "Đang tải...",
    email: "...",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAvxKarOtflssf0DRAIlS7rBsZ2CsimMFiMYmnTyqxz6vhQRYPiMwW1HB9sf50iMpv1NdhjSpUsPrZtEcFFuDwagAYqXHATw6AYTj6Qe8Jbvf3jEoMM3FBZf9to-OualWQgWjZ0Ga-j1RgW52VCm0EkeQGLFldPGpOpkICGcdcAbKf_fkjvUlHOYhC7mFfzjM4-TI2yrUKNYoF9VuVgvDhKsZ70BsrOCe45CaxVB9cqarYDYpxV9rZNM-6wv_kZxM8n90vlMGhZac0",
  });

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userInfoString = await AsyncStorage.getItem('userInfo');
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          setUser(prev => ({
            ...prev,
            name: userInfo.fullName || userInfo.name || "Người dùng",
            email: userInfo.email || "",
            avatar: userInfo.avatarUrl || prev.avatar
          }));
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin user:", error);
      }
    };
    
    loadUserInfo();
  }, []);

  const bottomSpace = Platform.OS === "ios" ? 100 + insets.bottom : 100;

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?",
      [
        { text: "Hủy", onPress: () => {}, style: "cancel" },
        {
          text: "Đăng xuất",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userInfo');
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <TopNavbar />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomSpace },
        ]}
        style={styles.container}
      >
        {/* Profile Section */}
        <ProfileSection user={user} onEditPress={() => {}} />

        {/* App Settings Section */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Thiết lập ứng dụng" />
          <View style={styles.sectionWrapper}>
            {/* Notifications */}
            <SettingsItem
              icon="notifications-outline"
              label="Thông báo"
              description="Nhận tin nhắn về hạn sử dụng"
              iconColor={COLORS.primary}
            >
              <SettingsToggle
                value={notificationsEnabled}
                onChange={setNotificationsEnabled}
              />
            </SettingsItem>

            {/* Dark Mode */}
            <SettingsItem
              icon="moon-outline"
              label="Chế độ tối"
              description="Tối ưu cho môi trường ánh sáng yếu"
              iconColor={COLORS.secondary}
            >
              <SettingsToggle value={darkMode} onChange={setDarkMode} />
            </SettingsItem>

            {/* Language */}
            <SettingsItem
              icon="language"
              label="Ngôn ngữ"
              description={`Hiện tại: ${language === "vi" ? "Tiếng Việt" : "English"}`}
              iconColor={COLORS.tertiary}
              onPress={() => {
                // TODO: Implement language selection
                console.log("Change language");
              }}
              showChevron
              isLast
            />
          </View>
        </View>

        {/* Data & Privacy Section */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Dữ liệu & Quyền riêng tư" />
          <View style={styles.sectionWrapper}>
            <SettingsItem
              icon="cloud-upload-outline"
              label="Sao lưu dữ liệu"
              iconColor={COLORS.onSurfaceVariant}
              onPress={() => {
                // TODO: Implement backup
                console.log("Backup data");
              }}
              showChevron
            />

            <SettingsItem
              icon="people-outline"
              label="Family Cloud"
              description="Quản lý gia đình và quyền chia sẻ"
              iconColor={COLORS.primary}
              onPress={() => navigation.navigate("FamilyCloud")}
              showChevron
            />

            <SettingsItem
              icon="card-outline"
              label="Premium & thanh toán"
              description="Mở khóa Family Cloud và giới hạn thành viên"
              iconColor={COLORS.secondary}
              onPress={() => navigation.navigate("Subscription")}
              showChevron
            />

            <SettingsItem
              icon="lock-closed-outline"
              label="Chính sách bảo mật"
              iconColor={COLORS.onSurfaceVariant}
              onPress={() => {
                // TODO: Implement privacy policy
                console.log("Open privacy policy");
              }}
              showChevron
              isLast
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Về ứng dụng" />
          <View style={styles.sectionWrapper}>
            <SettingsItem
              icon="information-circle-outline"
              label="Phiên bản ứng dụng"
              description="v2.4.0 (Fresh)"
              iconColor={COLORS.onSurfaceVariant}
            />

            <SettingsItem
              icon="help-circle-outline"
              label="Hỗ trợ"
              iconColor={COLORS.onSurfaceVariant}
              onPress={() => {
                // TODO: Implement support
                console.log("Open support");
              }}
              showChevron
              isLast
            />
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLogout}
            style={[styles.logoutButton, { borderColor: COLORS.error }]}
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>FreshFriends</Text>
          <Text style={styles.footerSubtitle}>Conscious Efficiency • 2024</Text>
        </View>
      </ScrollView>

      <BottomNavbar />
    </ScreenContainer>
  );
}
