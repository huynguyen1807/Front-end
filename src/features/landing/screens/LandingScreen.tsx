import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import WebThemeToggle from "../../../components/layout/WebThemeToggle";

const colors = {
  background: "var(--ff-landing-background)",
  surface: "var(--ff-landing-surface)",
  ink: "var(--ff-landing-ink)",
  muted: "var(--ff-landing-muted)",
  green: "var(--ff-landing-green)",
  greenDark: "var(--ff-landing-green-dark)",
  paleGreen: "var(--ff-landing-pale-green)",
  yellow: "var(--ff-landing-yellow)",
  line: "var(--ff-landing-line)",
};

const features = [
  {
    icon: "kitchen",
    color: "var(--ff-primary)",
    background: "var(--ff-feature-one)",
    title: "Nhìn rõ căn bếp",
    description: "Lưu món đang có, số lượng và vị trí để khỏi mua trùng hay quên mất.",
  },
  {
    icon: "notifications-active",
    color: "var(--ff-tertiary)",
    background: "var(--ff-feature-two)",
    title: "Dùng đúng lúc",
    description: "Theo dõi hạn sử dụng và để ý những món nên được dùng trước.",
  },
  {
    icon: "restaurant-menu",
    color: "var(--ff-secondary)",
    background: "var(--ff-feature-three)",
    title: "Bớt đau đầu nghĩ món",
    description: "Tham khảo gợi ý bữa ăn dựa trên thực phẩm bạn đang có.",
  },
  {
    icon: "people",
    color: "var(--ff-primary)",
    background: "var(--ff-feature-four)",
    title: "Cả nhà cùng phối hợp",
    description: "Chia sẻ việc theo dõi thực phẩm và danh sách mua sắm.",
  },
];

const audiences = [
  {
    icon: "people-outline",
    title: "Gia đình bận rộn",
    description: "Cùng biết nhà còn gì, bớt nhắn hỏi và mua dư khi đi chợ.",
  },
  {
    icon: "person-outline",
    title: "Người sống một mình",
    description: "Theo dõi đồ ăn trước khi chúng bị quên ở góc tủ lạnh.",
  },
  {
    icon: "restaurant",
    title: "Người thích nấu ăn",
    description: "Tìm cảm hứng cho món tiếp theo từ nguyên liệu sẵn có.",
  },
];

function LandingButton({
  children,
  onPress,
  secondary = false,
  compact = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        compact && styles.compactButton,
        pressed && styles.buttonPressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

function PantryPreview() {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [float]);

  return (
    <Animated.View
      style={[
        styles.previewWrap,
        { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }] },
      ]}
    >
      <View style={styles.previewDecorTop} />
      <View style={styles.previewDecorBottom} />
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <View>
            <Text style={styles.previewEyebrow}>GÓC BẾP CỦA BẠN</Text>
            <Text style={styles.previewTitle}>Tủ lạnh hôm nay</Text>
          </View>
          <View style={styles.previewAvatar}>
            <MaterialIcons name="eco" size={19} color={colors.green} />
          </View>
        </View>

        <View style={styles.previewSummary}>
          <View style={styles.summaryIcon}>
            <MaterialIcons name="kitchen" size={23} color={colors.green} />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryCount}>12 món</Text>
            <Text style={styles.summaryCaption}>đang được theo dõi</Text>
          </View>
          <View style={styles.summaryStatus}>
            <Text style={styles.summaryStatusText}>Ổn áp</Text>
          </View>
        </View>

        <Text style={styles.previewSectionTitle}>Nên dùng sớm</Text>
        <View style={styles.foodRow}>
          <View style={[styles.foodEmoji, { backgroundColor: "var(--ff-produce-warm)" }]}>
            <Text style={styles.emojiText}>🥑</Text>
          </View>
          <View style={styles.foodInfo}>
            <Text style={styles.foodName}>Bơ chín</Text>
            <Text style={styles.foodMeta}>Ngăn mát · 2 quả</Text>
          </View>
          <View style={styles.expiryBadge}>
            <Text style={styles.expiryText}>Còn 1 ngày</Text>
          </View>
        </View>
        <View style={styles.foodRow}>
          <View style={[styles.foodEmoji, { backgroundColor: "var(--ff-produce-red)" }]}>
            <Text style={styles.emojiText}>🍅</Text>
          </View>
          <View style={styles.foodInfo}>
            <Text style={styles.foodName}>Cà chua</Text>
            <Text style={styles.foodMeta}>Kệ bếp · 4 quả</Text>
          </View>
          <View style={styles.freshBadge}>
            <Text style={styles.freshText}>Còn 3 ngày</Text>
          </View>
        </View>

        <View style={styles.previewTip}>
          <MaterialIcons name="lightbulb-outline" size={18} color="var(--ff-secondary)" />
          <Text style={styles.previewTipText}>
            Có thể dùng bơ cho món salad tối nay
          </Text>
        </View>
      </View>
      <View style={styles.floatingNote}>
        <View style={styles.floatingCheck}>
          <MaterialIcons name="check" size={15} color="#fff" />
        </View>
        <Text style={styles.floatingNoteText}>Bếp gọn, lòng nhẹ</Text>
      </View>
    </Animated.View>
  );
}

export default function LandingScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isWide = width >= 820;
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const [featuresY, setFeaturesY] = useState(0);
  const [howItWorksY, setHowItWorksY] = useState(0);
  const [audiencesY, setAudiencesY] = useState(0);
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroOffset = useRef(new Animated.Value(22)).current;

  const goTo = (y: number) => scrollRef.current?.scrollTo({ y, animated: true });
  const openLogin = () => navigation.navigate("Login");

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroOffset, {
        toValue: 0,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroOpacity, heroOffset]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.headerInner, !isWide && styles.headerInnerNarrow]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="FreshFriends - về đầu trang"
            onPress={() => goTo(0)}
            style={styles.brand}
          >
            <View style={styles.brandMark}>
              <MaterialIcons name="eco" size={23} color={colors.greenDark} />
            </View>
            <Text style={styles.brandName}>FreshFriends</Text>
          </Pressable>
          {isWide ? (
            <View style={styles.headerLinks}>
              <Pressable onPress={() => goTo(featuresY)} style={styles.navLink}>
                <Text style={styles.navLinkText}>Tính năng</Text>
              </Pressable>
              <Pressable onPress={() => goTo(audiencesY)} style={styles.navLink}>
                <Text style={styles.navLinkText}>Dành cho ai</Text>
              </Pressable>
              <Pressable onPress={() => goTo(howItWorksY)} style={styles.navLink}>
                <Text style={styles.navLinkText}>Cách bắt đầu</Text>
              </Pressable>
              <View style={styles.headerActions}>
                <LandingButton onPress={openLogin} compact>
                  <Text style={styles.buttonText}>Đăng nhập</Text>
                  <MaterialIcons name="arrow-forward" size={17} color={colors.greenDark} />
                </LandingButton>
                <WebThemeToggle />
              </View>
            </View>
          ) : (
            <View style={styles.headerActionsNarrow}>
              <LandingButton onPress={openLogin} compact>
                <Text style={styles.buttonText}>Đăng nhập</Text>
              </LandingButton>
              <WebThemeToggle />
            </View>
          )}
        </View>
      </View>

      <View style={[styles.hero, !isWide && styles.heroNarrow]}>
        <View style={[styles.heroInner, !isWide && styles.heroInnerNarrow]}>
          <Animated.View
            style={[
              styles.heroCopy,
              !isWide && styles.heroCopyNarrow,
              { opacity: heroOpacity, transform: [{ translateY: heroOffset }] },
            ]}
          >
            <View style={styles.eyebrowPill}>
              <MaterialIcons name="auto-awesome" size={16} color={colors.yellow} />
              <Text style={styles.eyebrowText}>BẾP GỌN HƠN, NGÀY NHẸ HƠN</Text>
            </View>
            <Text style={[styles.heroTitle, !isWide && styles.heroTitleNarrow]}>
              Đừng để đồ ăn{"\n"}bị lãng quên{"\n"}
              <Text style={styles.heroTitleAccent}>trong tủ lạnh.</Text>
            </Text>
            <Text style={styles.heroDescription}>
              FreshFriends giúp bạn và gia đình theo dõi thực phẩm, nhớ món sắp
              hết hạn và nghĩ ra bữa ăn từ những gì đang có — tất cả trong một
              nơi dễ dùng.
            </Text>
            <View style={[styles.heroActions, !isWide && styles.heroActionsNarrow]}>
              <LandingButton onPress={openLogin}>
                <Text style={styles.buttonText}>Bắt đầu quản lý căn bếp</Text>
                <MaterialIcons name="arrow-forward" size={18} color={colors.greenDark} />
              </LandingButton>
              <LandingButton secondary onPress={() => goTo(featuresY)}>
                <Text style={styles.secondaryButtonText}>Xem FreshFriends giúp gì</Text>
              </LandingButton>
            </View>
            <View style={styles.heroFootnote}>
              <View style={styles.avatarStack}>
                <View style={[styles.miniAvatar, { backgroundColor: "#f4d8c8" }]}>
                  <Text style={styles.miniAvatarText}>A</Text>
                </View>
                <View style={[styles.miniAvatar, { backgroundColor: "#d9e8d8" }]}>
                  <Text style={styles.miniAvatarText}>M</Text>
                </View>
                <View style={[styles.miniAvatar, { backgroundColor: "#f6e5ad" }]}>
                  <Text style={styles.miniAvatarText}>L</Text>
                </View>
              </View>
              <Text style={styles.heroFootnoteText}>Cho gia đình bận rộn và người yêu căn bếp</Text>
            </View>
          </Animated.View>
          <Animated.View
            style={[
              styles.heroVisual,
              !isWide && styles.heroVisualNarrow,
              { opacity: heroOpacity },
            ]}
          >
            <PantryPreview />
          </Animated.View>
        </View>
      </View>

      <View style={styles.promiseBar}>
        <View style={[styles.promiseInner, !isWide && styles.promiseInnerNarrow]}>
          <Text style={styles.promiseLead}>Một người bạn cho căn bếp</Text>
          <View style={styles.promiseItems}>
            <View style={styles.promiseItem}>
              <MaterialIcons name="inventory-2" size={17} color={colors.green} />
              <Text style={styles.promiseText}>Biết nhà đang có gì</Text>
            </View>
            <View style={styles.promiseItem}>
              <MaterialIcons name="schedule" size={18} color={colors.green} />
              <Text style={styles.promiseText}>Ưu tiên món sắp hết hạn</Text>
            </View>
            <View style={styles.promiseItem}>
              <MaterialIcons name="restaurant" size={18} color={colors.green} />
              <Text style={styles.promiseText}>Gợi ý bữa ăn & mua sắm</Text>
            </View>
          </View>
        </View>
      </View>

      <View
        style={styles.section}
        onLayout={(event) => setFeaturesY(event.nativeEvent.layout.y)}
      >
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>ÍT LÃNG PHÍ HƠN, NHIỀU THỜI GIAN HƠN</Text>
          <Text style={[styles.sectionTitle, !isWide && styles.sectionTitleNarrow]}>
            Từ chiếc tủ lạnh{"\n"}
            <Text style={styles.sectionTitleAccent}>đến bữa cơm mỗi ngày.</Text>
          </Text>
          <Text style={styles.sectionDescription}>
            Không cần nhớ hết mọi thứ trong đầu. FreshFriends đồng hành với bạn
            từ lúc cất đồ ăn đến khi lên ý tưởng cho bữa tiếp theo.
          </Text>
        </View>
        <View style={[styles.featureGrid, !isWide && styles.featureGridNarrow]}>
          {features.map((feature) => (
            <View
              key={feature.title}
              style={[
                styles.featureCard,
                { flexBasis: isWide ? "22%" : width >= 560 ? "44%" : "100%" },
              ]}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.background }]}>
                <MaterialIcons
                  name={feature.icon as keyof typeof MaterialIcons.glyphMap}
                  size={24}
                  color={feature.color}
                />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      <View
        style={styles.audienceSection}
        onLayout={(event) => setAudiencesY(event.nativeEvent.layout.y)}
      >
        <View style={[styles.audienceInner, !isWide && styles.audienceInnerNarrow]}>
          <View style={styles.audienceIntro}>
            <Text style={styles.sectionEyebrow}>DÀNH CHO NHỮNG CĂN BẾP THẬT</Text>
            <Text style={[styles.audienceTitle, !isWide && styles.sectionTitleNarrow]}>
              Dù bạn nấu cho{"\n"}một người hay cả nhà.
            </Text>
            <Text style={styles.audienceDescription}>
              Mỗi nhà có một nhịp sống riêng. Bắt đầu từ điều bạn cần nhất,
              FreshFriends giúp việc chăm sóc căn bếp trở nên rõ ràng hơn.
            </Text>
          </View>
          <View style={[styles.audienceGrid, !isWide && styles.audienceGridNarrow]}>
            {audiences.map((audience, index) => (
              <View
                key={audience.title}
                style={[
                  styles.audienceCard,
                  { flexBasis: isWide ? "30%" : width >= 560 ? "46%" : "100%" },
                  index === 1 && styles.audienceCardAccent,
                ]}
              >
                <View style={styles.audienceIcon}>
                  <MaterialIcons
                    name={audience.icon as keyof typeof MaterialIcons.glyphMap}
                    size={24}
                    color={index === 1 ? colors.yellow : colors.green}
                  />
                </View>
                <Text style={[styles.audienceCardTitle, index === 1 && styles.audienceCardTitleLight]}>
                  {audience.title}
                </Text>
                <Text style={[styles.audienceCardDescription, index === 1 && styles.audienceCardDescriptionLight]}>
                  {audience.description}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View
        style={[styles.howSection, !isWide && styles.howSectionNarrow]}
        onLayout={(event) => setHowItWorksY(event.nativeEvent.layout.y)}
      >
        <View style={[styles.howInner, !isWide && styles.howInnerNarrow]}>
          <View style={styles.howCopy}>
            <Text style={styles.sectionEyebrow}>BẮT ĐẦU THẬT DỄ</Text>
            <Text style={[styles.howTitle, !isWide && styles.howTitleNarrow]}>
              Căn bếp mới{"\n"}chỉ cách bạn{" "}
              <Text style={styles.howTitleAccent}>3 bước.</Text>
            </Text>
            <Text style={styles.howDescription}>
              Không cần thay đổi thói quen thật nhiều. Chỉ cần bắt đầu ghi lại
              những gì bạn đang có.
            </Text>
          </View>
          <View style={styles.steps}>
            {[
              ["01", "Ghi lại thực phẩm", "Thêm món, số lượng và hạn dùng."],
              ["02", "Cùng theo dõi", "Cả nhà biết đồ ăn đang ở đâu."],
              ["03", "Chọn món tiếp theo", "Dùng đồ sẵn có trước khi mua thêm."],
            ].map(([number, title, description]) => (
              <View key={number} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{number}</Text>
                </View>
                <View style={styles.stepCopy}>
                  <Text style={styles.stepTitle}>{title}</Text>
                  <Text style={styles.stepDescription}>{description}</Text>
                </View>
                {number !== "03" && <View style={styles.stepConnector} />}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.finalCta}>
        <View style={[styles.finalCtaInner, !isWide && styles.finalCtaInnerNarrow]}>
          <View style={styles.finalCtaIcon}>
            <MaterialIcons name="eco" size={28} color={colors.greenDark} />
          </View>
          <Text style={[styles.finalCtaTitle, !isWide && styles.finalCtaTitleNarrow]}>
            Cùng làm căn bếp{"\n"}dễ thở hơn nhé?
          </Text>
          <Text style={styles.finalCtaDescription}>
            Bớt quên thực phẩm, bớt phân vân hôm nay ăn gì.
          </Text>
          <LandingButton onPress={openLogin}>
            <Text style={styles.buttonText}>Đăng nhập để bắt đầu</Text>
            <MaterialIcons name="arrow-forward" size={18} color={colors.greenDark} />
          </LandingButton>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.footerInner, !isWide && styles.footerInnerNarrow]}>
          <View style={styles.brand}>
            <View style={styles.footerBrandMark}>
              <MaterialIcons name="eco" size={18} color="#fff" />
            </View>
            <Text style={styles.footerBrandName}>FreshFriends</Text>
          </View>
          <Text style={styles.footerText}>
            Gọn căn bếp. Vui mỗi bữa.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageContent: {
    minHeight: "100%",
  },
  header: {
    backgroundColor: colors.greenDark,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  headerInner: {
    width: "100%",
    maxWidth: 1200,
    minHeight: 82,
    alignSelf: "center",
    paddingLeft: 36,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerInnerNarrow: {
    minHeight: 70,
    paddingLeft: 22,
    paddingRight: 12,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 34,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerActionsNarrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  navLink: {
    paddingVertical: 10,
  },
  navLinkText: {
    color: "#d4e0d8",
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 22,
    backgroundColor: colors.yellow,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    shadowColor: colors.greenDark,
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    shadowOpacity: 0,
    elevation: 0,
  },
  compactButton: {
    minHeight: 42,
    borderRadius: 13,
    paddingHorizontal: 17,
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonText: {
    color: colors.greenDark,
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  hero: {
    width: "100%",
    backgroundColor: colors.greenDark,
  },
  heroNarrow: {
    paddingTop: 24,
  },
  heroInner: {
    width: "100%",
    maxWidth: 1200,
    minHeight: 620,
    alignSelf: "center",
    paddingHorizontal: 36,
    paddingTop: 58,
    paddingBottom: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 44,
  },
  heroInnerNarrow: {
    minHeight: 0,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 44,
    flexDirection: "column",
    alignItems: "stretch",
    gap: 32,
  },
  heroCopy: {
    flex: 1,
    maxWidth: 545,
    alignItems: "flex-start",
  },
  heroCopyNarrow: {
    maxWidth: 680,
  },
  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(217,243,106,0.32)",
    backgroundColor: "rgba(217,243,106,0.1)",
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginBottom: 23,
  },
  eyebrowText: {
    color: colors.yellow,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.15,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 57,
    lineHeight: 66,
    fontWeight: "800",
    letterSpacing: -2.4,
  },
  heroTitleNarrow: {
    fontSize: 43,
    lineHeight: 51,
    letterSpacing: -1.6,
  },
  heroTitleAccent: {
    color: colors.yellow,
  },
  heroDescription: {
    maxWidth: 500,
    color: "#c5d4cb",
    fontSize: 16,
    lineHeight: 27,
    marginTop: 19,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 28,
    flexWrap: "wrap",
  },
  heroActionsNarrow: {
    alignItems: "stretch",
  },
  heroFootnote: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    gap: 12,
  },
  avatarStack: {
    flexDirection: "row",
    paddingLeft: 1,
  },
  miniAvatar: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.greenDark,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -2,
  },
  miniAvatarText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: "800",
  },
  heroFootnoteText: {
    color: "#c5d4cb",
    fontSize: 12,
  },
  heroVisual: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  heroVisualNarrow: {
    width: "100%",
  },
  previewWrap: {
    width: "100%",
    maxWidth: 480,
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingVertical: 24,
  },
  previewDecorTop: {
    position: "absolute",
    top: 20,
    right: 12,
    width: 230,
    height: 230,
    borderRadius: 120,
    backgroundColor: colors.yellow,
    opacity: 0.8,
  },
  previewDecorBottom: {
    position: "absolute",
    bottom: 4,
    left: 0,
    width: 160,
    height: 160,
    borderRadius: 90,
    backgroundColor: "#f1a17f",
    opacity: 0.75,
  },
  previewCard: {
    width: "88%",
    maxWidth: 390,
    borderRadius: 27,
    backgroundColor: colors.surface,
    padding: 23,
    shadowColor: "#18352b",
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 15 },
    elevation: 7,
    borderWidth: 1,
    borderColor: "rgba(24, 53, 43, 0.05)",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 21,
  },
  previewEyebrow: {
    color: "#89958d",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  previewTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 5,
  },
  previewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.paleGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  previewSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 17,
    padding: 13,
    marginBottom: 23,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.paleGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryText: {
    flex: 1,
    marginLeft: 11,
  },
  summaryCount: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  summaryCaption: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
  },
  summaryStatus: {
    backgroundColor: "var(--ff-status-good)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  summaryStatusText: {
    color: colors.green,
    fontSize: 10,
    fontWeight: "700",
  },
  previewSectionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 9,
  },
  foodRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  foodEmoji: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 21,
  },
  foodInfo: {
    flex: 1,
    marginLeft: 11,
  },
  foodName: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  foodMeta: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 4,
  },
  expiryBadge: {
    backgroundColor: "var(--ff-produce-warm)",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  expiryText: {
    color: "var(--ff-secondary)",
    fontSize: 9,
    fontWeight: "700",
  },
  freshBadge: {
    backgroundColor: "var(--ff-status-good)",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  freshText: {
    color: colors.green,
    fontSize: 9,
    fontWeight: "700",
  },
  previewTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 13,
    backgroundColor: "var(--ff-tip-background)",
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginTop: 17,
  },
  previewTipText: {
    flex: 1,
    color: "var(--ff-tip-text)",
    fontSize: 10,
    fontWeight: "600",
  },
  floatingNote: {
    position: "absolute",
    bottom: 4,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 99,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    paddingVertical: 10,
    shadowColor: "#18352b",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  floatingCheck: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingNoteText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "700",
  },
  promiseBar: {
    backgroundColor: colors.yellow,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.yellow,
  },
  promiseInner: {
    width: "100%",
    maxWidth: 1200,
    minHeight: 82,
    alignSelf: "center",
    paddingHorizontal: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  promiseInnerNarrow: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    alignItems: "flex-start",
    flexDirection: "column",
    gap: 13,
  },
  promiseLead: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  promiseItems: {
    flexDirection: "row",
    alignItems: "center",
    gap: 26,
    flexWrap: "wrap",
  },
  promiseItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  promiseText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 36,
    paddingTop: 100,
    paddingBottom: 108,
  },
  sectionHeading: {
    alignItems: "center",
    maxWidth: 630,
    alignSelf: "center",
  },
  sectionEyebrow: {
    color: colors.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    textAlign: "center",
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -1.2,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 14,
  },
  sectionTitleNarrow: {
    fontSize: 29,
    lineHeight: 37,
  },
  sectionTitleAccent: {
    color: colors.green,
  },
  sectionDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 13,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    marginTop: 44,
  },
  featureGridNarrow: {
    gap: 12,
    marginTop: 30,
  },
  featureCard: {
    flexGrow: 1,
    minWidth: 220,
    minHeight: 215,
    padding: 22,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  featureTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  featureDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 20,
  },
  audienceSection: {
    width: "100%",
    backgroundColor: colors.background,
  },
  audienceInner: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 36,
    paddingVertical: 96,
  },
  audienceInnerNarrow: {
    paddingHorizontal: 22,
    paddingVertical: 66,
  },
  audienceIntro: {
    maxWidth: 650,
    alignSelf: "center",
    alignItems: "center",
  },
  audienceTitle: {
    color: colors.ink,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -1.2,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 14,
  },
  audienceDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 13,
  },
  audienceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    marginTop: 42,
  },
  audienceGridNarrow: {
    gap: 12,
    marginTop: 28,
  },
  audienceCard: {
    flexGrow: 1,
    minWidth: 220,
    minHeight: 190,
    padding: 22,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  audienceCardAccent: {
    backgroundColor: colors.greenDark,
    borderColor: colors.greenDark,
  },
  audienceIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.paleGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  audienceCardTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  audienceCardTitleLight: {
    color: "#fff",
  },
  audienceCardDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 20,
  },
  audienceCardDescriptionLight: {
    color: "#c5d4cb",
  },
  howSection: {
    width: "100%",
    backgroundColor: "var(--ff-how-background)",
  },
  howSectionNarrow: {
    paddingHorizontal: 22,
  },
  howInner: {
    width: "100%",
    maxWidth: 1128,
    alignSelf: "center",
    paddingHorizontal: 36,
    paddingVertical: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 80,
  },
  howInnerNarrow: {
    paddingHorizontal: 0,
    paddingVertical: 65,
    flexDirection: "column",
    alignItems: "stretch",
    gap: 35,
  },
  howCopy: {
    flex: 1,
    alignItems: "flex-start",
  },
  howTitle: {
    color: colors.ink,
    fontSize: 39,
    lineHeight: 48,
    fontWeight: "800",
    letterSpacing: -1.3,
    marginTop: 16,
  },
  howTitleNarrow: {
    fontSize: 33,
    lineHeight: 41,
  },
  howTitleAccent: {
    color: colors.green,
  },
  howDescription: {
    maxWidth: 390,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 23,
    marginTop: 13,
  },
  steps: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
    gap: 0,
  },
  stepRow: {
    minHeight: 81,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  stepNumber: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  stepNumberText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "800",
  },
  stepCopy: {
    marginLeft: 16,
  },
  stepTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  stepDescription: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 5,
  },
  stepConnector: {
    position: "absolute",
    left: 21,
    top: 61,
    height: 25,
    width: 1,
    backgroundColor: "var(--ff-step-connector)",
  },
  finalCta: {
    backgroundColor: colors.greenDark,
  },
  finalCtaInner: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    alignItems: "center",
    paddingHorizontal: 36,
    paddingVertical: 86,
  },
  finalCtaInnerNarrow: {
    paddingHorizontal: 22,
    paddingVertical: 68,
  },
  finalCtaIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  finalCtaTitle: {
    color: "#fff",
    fontSize: 39,
    lineHeight: 47,
    fontWeight: "800",
    letterSpacing: -1.2,
    textAlign: "center",
  },
  finalCtaTitleNarrow: {
    fontSize: 32,
    lineHeight: 40,
  },
  finalCtaDescription: {
    maxWidth: 420,
    color: "#d5e5d9",
    fontSize: 14,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 25,
  },
  footer: {
    backgroundColor: colors.greenDark,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.14)",
  },
  footerInner: {
    width: "100%",
    maxWidth: 1200,
    minHeight: 78,
    alignSelf: "center",
    paddingHorizontal: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },
  footerInnerNarrow: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    flexWrap: "wrap",
  },
  footerBrandMark: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: "#315f46",
    alignItems: "center",
    justifyContent: "center",
  },
  footerBrandName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  footerText: {
    color: "#c8d8cd",
    fontSize: 12,
  },
});
