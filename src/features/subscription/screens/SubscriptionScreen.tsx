import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../../../constants/colors";
import {
  createSandboxPaymentApi,
  getCurrentSubscriptionApi,
  getPaymentHistoryApi,
  getSubscriptionPlansApi,
  markSandboxPaymentSuccessApi,
} from "../services/paymentApi";
import { subscriptionStyles as styles } from "../styles/SubscriptionScreen.styles";
import {
  CurrentSubscription,
  PaymentTransaction,
  PlanCode,
  SubscriptionPlan,
} from "../types/subscription";

function getErrorMessage(error: any) {
  return error?.response?.data?.message || error?.message || "Đã có lỗi xảy ra";
}

function formatMoney(value: number, currency: string) {
  return `${value.toLocaleString("vi-VN")} ${currency}`;
}

function getPlanLabel(planCode?: PlanCode) {
  if (planCode === "PREMIUM_MONTHLY") return "Premium tháng";
  if (planCode === "PREMIUM_YEARLY") return "Premium năm";
  return "Free";
}

export default function SubscriptionScreen() {
  const navigation = useNavigation<any>();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [history, setHistory] = useState<PaymentTransaction[]>([]);
  const [selectedPlanCode, setSelectedPlanCode] = useState<Exclude<PlanCode, "FREE">>(
    "PREMIUM_MONTHLY"
  );
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const premiumPlans = useMemo(
    () =>
      plans.filter((plan) =>
        ["PREMIUM_MONTHLY", "PREMIUM_YEARLY"].includes(plan.planCode)
      ) as Array<SubscriptionPlan & { planCode: Exclude<PlanCode, "FREE"> }>,
    [plans]
  );

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [nextPlans, nextCurrent, nextHistory] = await Promise.all([
        getSubscriptionPlansApi(),
        getCurrentSubscriptionApi(),
        getPaymentHistoryApi(),
      ]);
      setPlans(nextPlans);
      setCurrentSubscription(nextCurrent);
      setHistory(nextHistory);
    } catch (error: any) {
      Alert.alert("Không tải được gói Premium", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const handleSandboxPayment = async () => {
    try {
      setPaying(true);
      const payment = await createSandboxPaymentApi(selectedPlanCode);
      await markSandboxPaymentSuccessApi(payment.transaction.transactionCode);
      await loadSubscriptionData();
      Alert.alert("Thanh toán thành công", "Gói Premium đã được kích hoạt cho Family Cloud.");
    } catch (error: any) {
      Alert.alert("Thanh toán thất bại", getErrorMessage(error));
    } finally {
      setPaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Premium</Text>
        <TouchableOpacity onPress={loadSubscriptionData} style={styles.iconButton}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" />
        ) : (
          <>
            <View style={styles.currentCard}>
              <Text style={styles.currentLabel}>Gói hiện tại</Text>
              <Text style={styles.currentPlan}>
                {getPlanLabel(currentSubscription?.planCode)}
              </Text>
              <Text style={styles.currentText}>
                {currentSubscription?.isPremium
                  ? "Family Cloud đã được mở khóa. Bạn có thể tạo family và mời tối đa 5 thành viên."
                  : "Nâng cấp Premium để dùng Family Cloud."}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Chọn gói Premium</Text>
            {premiumPlans.map((plan) => {
              const selected = selectedPlanCode === plan.planCode;
              return (
                <TouchableOpacity
                  key={plan._id}
                  onPress={() => setSelectedPlanCode(plan.planCode)}
                  activeOpacity={0.85}
                  style={[styles.planCard, selected && styles.planCardSelected]}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.planName}</Text>
                    <Text style={styles.planPrice}>{formatMoney(plan.price, plan.currency)}</Text>
                  </View>
                  {plan.features.map((feature) => (
                    <Text key={feature} style={styles.featureText}>
                      {feature}
                    </Text>
                  ))}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={handleSandboxPayment}
              disabled={paying}
              style={[styles.payButton, paying && styles.payButtonDisabled]}
            >
              {paying ? (
                <ActivityIndicator color={COLORS.onPrimary} />
              ) : (
                <Text style={styles.payButtonText}>Thanh toán sandbox</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Lịch sử thanh toán</Text>
            {history.slice(0, 5).map((item) => (
              <View key={item._id} style={styles.historyItem}>
                <Text style={styles.historyTitle}>
                  {item.transactionCode} - {item.status}
                </Text>
                <Text style={styles.historyText}>
                  {formatMoney(item.amount, item.currency)}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
