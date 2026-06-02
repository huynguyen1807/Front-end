import { Ionicons } from "@expo/vector-icons";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "../../../components/common/Button";
import { COLORS } from "../../../constants/colors";
import { welcomeScreenStyles as styles } from "../styles/WelcomeScreen.styles";

interface WelcomeScreenProps {
  navigation: any;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Background Watermark Faint Logo */}
      <View style={styles.watermarkContainer}>
        <Ionicons name="restaurant-outline" size={260} color={COLORS.primary} />
      </View>

      {/* Header section (Logo and slogan) */}
      <View style={styles.headerSection}>
        <View style={styles.logoBox}>
          <View style={styles.logoInner}>
            <Ionicons name="leaf" size={72} color="#ffffff" />
          </View>
        </View>

        <Text style={styles.title}>Chào mừng đến với FreshTrack</Text>
        <Text style={styles.description}>
          Quản lý thực phẩm thông minh, giảm thiểu lãng phí và ăn uống lành mạnh
          hơn mỗi ngày.
        </Text>
      </View>

      {/* Action buttons and Social proof */}
      <View>
        {/* Buttons */}
        <View style={styles.buttonSection}>
          <AppButton
            title="Bắt đầu ngay"
            variant="primary"
            icon={<Ionicons name="arrow-forward" size={18} color="#ffffff" />}
            iconPosition="right"
            onPress={() => navigation.navigate("Home")}
          />
          <AppButton
            title="Tôi đã có tài khoản"
            variant="outline"
            style={styles.outlineBtn}
            onPress={() => navigation.navigate("Home")}
          />
        </View>

        {/* Social Proof */}
        <View style={styles.socialSection}>
          <View style={styles.avatarGroup}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
              }}
              style={styles.avatar}
            />
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
              }}
              style={[styles.avatar, styles.avatarOverlap]}
            />
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
              }}
              style={[styles.avatar, styles.avatarOverlap]}
            />
          </View>
          <Text style={styles.socialText}>
            Tham gia cùng hơn 50,000+ người dùng thông thái
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          © 2026 FreshTrack. Tôn trọng thực phẩm, bảo vệ môi trường.
        </Text>
      </View>
    </SafeAreaView>
  );
}
