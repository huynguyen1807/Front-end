import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import Constants from 'expo-constants';

import { COLORS } from '../../../constants/colors';
import { reloadPageOrRefresh } from '../../../utils/reloadPage';
import { getCurrentSubscriptionApi, getPaymentHistoryApi, getSubscriptionPlansApi } from '../services/paymentApi';
import { subscriptionStyles as styles } from '../styles/SubscriptionScreen.styles';
import { CurrentSubscription, PaymentTransaction, PlanCode, SubscriptionPlan } from '../types/subscription';
import FamilyPlanPanel from '../components/FamilyPlanPanel';

function getErrorMessage(error: any) {
  return error?.response?.data?.message || error?.message || 'Đã có lỗi xảy ra';
}
function formatMoney(value: number, currency: string) { return `${value.toLocaleString('vi-VN')} ${currency}`; }
function getPlanLabel(planCode?: PlanCode) {
  if (planCode === 'PREMIUM_MONTHLY') return 'Premium tháng';
  if (planCode === 'PREMIUM_YEARLY') return 'Premium năm';
  return 'Free';
}

function getPackagePlanCode(item: PurchasesPackage): Exclude<PlanCode, 'FREE'> | null {
  const productId = item.product.identifier.toLowerCase();
  if (item.identifier === '$rc_monthly' || productId === 'monthly') return 'PREMIUM_MONTHLY';
  if (item.identifier === '$rc_annual' || productId === 'yearly') return 'PREMIUM_YEARLY';
  return null;
}

function formatExpirationDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export default function SubscriptionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [current, setCurrent] = useState<CurrentSubscription | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [history, setHistory] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [loadError, setLoadError] = useState('');
  const expirationDate = formatExpirationDate(current?.endDate);
  const isExpoGo = Constants.appOwnership === 'expo';
  const isWeb = Platform.OS === 'web';

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [subscriptionResult, historyResult, plansResult] = await Promise.allSettled([
        getCurrentSubscriptionApi(),
        getPaymentHistoryApi(),
        getSubscriptionPlansApi()
      ]);
      if (subscriptionResult.status === 'rejected') throw subscriptionResult.reason;
      const subscription = subscriptionResult.value;
      setCurrent(subscription);
      setHistory(historyResult.status === 'fulfilled' ? historyResult.value : []);
      setPlans(plansResult.status === 'fulfilled' ? plansResult.value : []);
      if (historyResult.status === 'rejected' || plansResult.status === 'rejected') setLoadError('Một số thông tin chưa tải được. Bạn vẫn có thể xem Family Plan và thử tải lại.');
      let nextPackages: PurchasesPackage[] = [];
      if (!isExpoGo && !isWeb) {
        try {
          const revenueCat = await import('../services/revenueCatService');
          await revenueCat.initializeRevenueCat(subscription.appUserId);
          nextPackages = await revenueCat.getRevenueCatPackages();
        } catch (error) { setLoadError(getErrorMessage(error)); }
      }
      setPackages(nextPackages);
      setSelected((value) => value ?? nextPackages[0] ?? null);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadData(); }, []);

  const handleReload = () => {
    reloadPageOrRefresh(loadData);
  };

  const handlePurchase = async () => {
    if (!selected) return;
    try {
      setPaying(true);
      const { purchaseRevenueCatPackage, hasPremiumEntitlement, getActiveEntitlementIds } = await import('../services/revenueCatService');
      const customerInfo = await purchaseRevenueCatPackage(selected);
      if (!hasPremiumEntitlement(customerInfo)) {
        const activeIds = getActiveEntitlementIds(customerInfo);
        throw new Error(
          activeIds.length > 0
            ? `Giao dịch đã tạo entitlement "${activeIds.join(', ')}", nhưng ứng dụng cần "premium". Hãy sửa Entitlement ID trên RevenueCat.`
            : 'Giao dịch test hợp lệ nhưng RevenueCat không cấp entitlement "premium". Hãy gắn product vào entitlement premium và bật Sandbox Testing Access.'
        );
      }
      Alert.alert('Thanh toán thành công', 'Premium đã được kích hoạt. Backend sẽ đồng bộ qua RevenueCat webhook.');
      setTimeout(() => void loadData(), 1500);
    } catch (error: any) {
      if (!error?.userCancelled) Alert.alert('Thanh toán thất bại', getErrorMessage(error));
    } finally { setPaying(false); }
  };

  const handleRestore = async () => {
    try {
      setPaying(true);
      const { restoreRevenueCatPurchases, hasPremiumEntitlement } = await import('../services/revenueCatService');
      const customerInfo = await restoreRevenueCatPurchases();
      Alert.alert(
        hasPremiumEntitlement(customerInfo) ? 'Khôi phục thành công' : 'Không tìm thấy giao dịch',
        hasPremiumEntitlement(customerInfo) ? 'Quyền Premium đã được khôi phục.' : 'Tài khoản store này chưa có Premium.'
      );
      setTimeout(() => void loadData(), 1500);
    } catch (error) { Alert.alert('Không thể khôi phục', getErrorMessage(error)); }
    finally { setPaying(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate(current ? 'Main' : 'Login')} style={styles.iconButton}><Ionicons name="chevron-back" size={24} color={COLORS.onSurface} /></TouchableOpacity>
        <Text style={styles.title}>Gói dịch vụ</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Làm mới trang" disabled={loading || paying} onPress={handleReload} style={styles.iconButton}><Ionicons name="refresh" size={20} color={COLORS.primary} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator color={COLORS.primary} size="large" /> : <>
          {loadError ? <Text accessibilityLiveRegion="polite" style={styles.errorText}>{loadError}</Text> : null}
          {current ? <FamilyPlanPanel appUserId={current.appUserId} requestedHouseholdId={route.params?.householdId} returnedOrderCode={route.params?.returnedOrderCode}
            onPaymentVerified={() => { void getPaymentHistoryApi().then(setHistory).catch(() => undefined); }} /> : null}
          {current ? <View style={styles.currentCard}>
            <Text style={styles.currentLabel}>Gói cá nhân</Text>
            <Text style={styles.currentPlan}>{getPlanLabel(current?.planCode)}</Text>
            <Text style={styles.currentText}>{current?.isPremium ? 'Các quyền Premium cá nhân đang hoạt động.' : 'Bạn đang sử dụng gói cá nhân Free.'}</Text>
            {current?.isPremium && expirationDate ? (
              <View style={styles.expirationRow}>
                <Ionicons name="calendar-outline" size={17} color={COLORS.onPrimaryContainer} />
                <Text style={styles.expirationText}>Hết hạn ngày {expirationDate}</Text>
              </View>
            ) : null}
          </View> : null}
          {!isWeb ? <Text style={styles.sectionTitle}>Chọn gói Premium</Text> : null}
          {isExpoGo && !isWeb ? <Text style={styles.featureText}>Bạn có thể xem các gói trong Expo Go. Thanh toán Family qua payOS trên website, không cần development build.</Text> : null}
          {!isWeb && packages.length === 0 ? plans.filter(plan => plan.planCode !== 'FREE').map(plan => <View key={plan._id} style={styles.planCard}>
            <Text style={styles.planName}>{plan.planName}</Text><Text style={styles.planPrice}>{formatMoney(plan.price, plan.currency)}</Text>
            <Text style={styles.featureText}>Gói Premium cá nhân thanh toán qua App Store / Google Play trên bản ứng dụng hỗ trợ.</Text>
          </View>) : null}
          {packages.map((item) => {
            const active = selected?.identifier === item.identifier;
            const planCode = getPackagePlanCode(item);
            const plan = plans.find((candidate) => candidate.planCode === planCode);
            const isYearly = planCode === 'PREMIUM_YEARLY';
            return <TouchableOpacity key={item.identifier} onPress={() => setSelected(item)} style={[styles.planCard, active && styles.planCardSelected]}>
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{isYearly ? 'Premium năm' : 'Premium tháng'}</Text>
                  {isYearly ? <Text style={styles.discountText}>Tiết kiệm 15%</Text> : null}
                </View>
                <Text style={styles.planPrice}>
                  {plan ? formatMoney(plan.price, plan.currency) : item.product.priceString}
                </Text>
              </View>
              <Text style={styles.featureText}>{isYearly ? 'Thanh toán mỗi năm' : 'Thanh toán mỗi tháng'}</Text>
            </TouchableOpacity>;
          })}
          {!isExpoGo && !isWeb ? <TouchableOpacity onPress={handlePurchase} disabled={paying || !selected} style={[styles.payButton, (paying || !selected) && styles.payButtonDisabled]}>
            {paying ? <ActivityIndicator color={COLORS.onPrimary} /> : <Text style={styles.payButtonText}>Đăng ký qua App Store / Google Play</Text>}
          </TouchableOpacity> : null}
          {!isExpoGo && !isWeb ? <TouchableOpacity onPress={handleRestore} disabled={paying} style={styles.restoreButton}><Text style={styles.restoreButtonText}>Khôi phục giao dịch</Text></TouchableOpacity> : null}
          <Text style={styles.sectionTitle}>Lịch sử thanh toán</Text>
          {history.slice(0, 5).map((item) => <View key={item._id} style={styles.historyItem}>
            <Text style={styles.historyTitle}>{item.transactionCode} - {item.status}</Text>
            <Text style={styles.historyText}>{formatMoney(item.amount, item.currency)}</Text>
          </View>)}
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}
