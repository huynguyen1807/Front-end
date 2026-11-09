import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';
import { getMyHouseholdsApi } from '../../familyCloud/services/familyCloudApi';
import type { MyHousehold } from '../../familyCloud/types/familyCloud';
import { createPayOSCheckoutApi, getFamilyPlansApi, getHouseholdSubscriptionApi, getPayOSPaymentStatusApi, startFamilyTrialApi } from '../services/paymentApi';
import type { FamilyPlanCode, HouseholdSubscription, PayOSPayment, SubscriptionPlan } from '../types/subscription';
import { canCheckoutFamily, familyPlanPeriod, parsePendingOrder, paymentMessage, safeCheckoutUrl } from '../utils/familyPayment';
import { subscriptionStyles as styles } from '../styles/SubscriptionScreen.styles';
import { reloadPageOrRefresh } from '../../../utils/reloadPage';

type Props = { appUserId: string; requestedHouseholdId?: string; returnedOrderCode?: number; onPaymentVerified: () => void };
const message = (error: any) => error?.response?.data?.message || error?.message || 'Chưa tải được dữ liệu. Vui lòng thử lại.';

export default function FamilyPlanPanel({ appUserId, requestedHouseholdId, returnedOrderCode, onPaymentVerified }: Props) {
  const navigation = useNavigation<any>();
  const [membership, setMembership] = useState<MyHousehold | null>(null);
  const [subscription, setSubscription] = useState<HouseholdSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null);
  const [payment, setPayment] = useState<PayOSPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [pollingEnded, setPollingEnded] = useState(false);
  const [showRenewal, setShowRenewal] = useState(false);
  const generation = useRef(0);
  const checkoutLock = useRef(false);
  const statusLock = useRef(false);
  const verifiedCallback = useRef(onPaymentVerified);
  verifiedCallback.current = onPaymentVerified;
  const householdId = membership?.household._id;
  const storageKey = (id: string) => `freshfriends:payos:${appUserId}:${id}`;

  const load = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true); setError(''); setSubscription(null); setPayment(null); setChecking(false); setPaying(false); setPollingEnded(false); setShowRenewal(false);
    try {
      const [households, catalogue] = await Promise.all([getMyHouseholdsApi(), getFamilyPlansApi()]);
      const next = requestedHouseholdId ? households.find((item) => item.household._id === requestedHouseholdId) ?? null : households[0] ?? null;
      const entitlement = next ? await getHouseholdSubscriptionApi(next.household._id) : null;
      if (request !== generation.current) return;
      setMembership(next); setSubscription(entitlement); setPlans(catalogue);
      setSelected(catalogue.find((plan) => plan.planCode === (entitlement?.scheduledSubscription?.planCode ?? entitlement?.subscription?.planCode)) ?? catalogue[0] ?? null);
      if (Platform.OS === 'web' && next && entitlement?.canManageSubscription) {
        let order: number | null = returnedOrderCode && Number.isSafeInteger(returnedOrderCode) && returnedOrderCode > 0 ? returnedOrderCode : null;
        try { order ??= parsePendingOrder(window.sessionStorage.getItem(storageKey(next.household._id)), next.household._id); } catch { /* Storage may be disabled. */ }
        if (order) {
          const restored = await getPayOSPaymentStatusApi(order);
          if (request !== generation.current) return;
          if (restored.householdId !== next.household._id) throw new Error('Phiên thanh toán không thuộc gia đình đang chọn.');
          setPayment(restored);
          // Status lookup can reconcile a missed webhook, so read entitlement again.
          if (restored.status === 'SUCCESS') {
            const refreshed = await getHouseholdSubscriptionApi(next.household._id);
            if (request !== generation.current) return;
            setSubscription(refreshed); verifiedCallback.current();
          }
        }
      }
    } catch (failure) { if (request === generation.current) setError(message(failure)); }
    finally { if (request === generation.current) setLoading(false); }
  }, [appUserId, requestedHouseholdId, returnedOrderCode]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { generation.current++; };
  }, [load]));

  const refreshPayment = useCallback(async () => {
    if (!payment || !householdId || !subscription?.canManageSubscription || statusLock.current) return;
    statusLock.current = true; setChecking(true); setError('');
    const request = generation.current;
    try {
      const next = await getPayOSPaymentStatusApi(payment.orderCode);
      if (request !== generation.current) return;
      if (next.householdId !== householdId) throw new Error('Phiên thanh toán không thuộc gia đình đang chọn.');
      setPayment(next);
      const entitlement = await getHouseholdSubscriptionApi(householdId);
      if (request !== generation.current) return;
      setSubscription(entitlement);
      if (next.status === 'SUCCESS') { setShowRenewal(false); verifiedCallback.current(); }
    } catch (failure) { if (request === generation.current) setError(message(failure)); }
    finally { statusLock.current = false; if (request === generation.current) setChecking(false); }
  }, [payment?.orderCode, householdId, subscription?.canManageSubscription]);

  useEffect(() => {
    if (Platform.OS !== 'web' || payment?.status !== 'PENDING' || !subscription?.canManageSubscription) return;
    let attempts = 0;
    setPollingEnded(false);
    const timer = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      if (++attempts > 12) { clearInterval(timer); setPollingEnded(true); return; }
      void refreshPayment();
    }, 5000);
    const onFocus = () => { void refreshPayment(); };
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [payment?.orderCode, payment?.status, subscription?.canManageSubscription, refreshPayment]);

  const checkout = async () => {
    if (!householdId || !canCheckoutFamily(Platform.OS, subscription, selected) || checkoutLock.current || payment?.status === 'PENDING') return;
    checkoutLock.current = true; setPaying(true); setError('');
    const request = generation.current;
    // Open during the user gesture; otherwise browsers may block a popup after HTTP.
    let popup: ReturnType<typeof window.open> = null;
    try {
      popup = window.open('about:blank', '_blank');
      if (popup) popup.opener = null;
      const next = await createPayOSCheckoutApi(householdId, selected!.planCode as FamilyPlanCode);
      if (request !== generation.current) { popup?.close(); return; }
      if (next.householdId !== householdId) throw new Error('Phiên thanh toán không thuộc gia đình đang chọn.');
      setPayment(next);
      try { window.sessionStorage.setItem(storageKey(householdId), JSON.stringify({ householdId, orderCode: next.orderCode })); } catch { /* Payment remains visible in this tab. */ }
      const url = safeCheckoutUrl(next.checkoutUrl);
      if (url && next.status === 'PENDING' && popup) popup.location.href = url;
      else popup?.close();
      if (next.status === 'SUCCESS') {
        setShowRenewal(false);
        const entitlement = await getHouseholdSubscriptionApi(householdId);
        if (request !== generation.current) return;
        setSubscription(entitlement); verifiedCallback.current();
      }
    } catch (failure) { popup?.close(); if (request === generation.current) setError(message(failure)); }
    finally { checkoutLock.current = false; if (request === generation.current) setPaying(false); }
  };

  const startTrial = async () => {
    if (!householdId || !subscription?.canManageSubscription || !subscription.trialEligibility?.eligible || checkoutLock.current || payment?.status === 'PENDING') return;
    const request = generation.current;
    checkoutLock.current = true; setPaying(true); setError('');
    try {
      await startFamilyTrialApi(householdId);
      const entitlement = await getHouseholdSubscriptionApi(householdId);
      if (request === generation.current) setSubscription(entitlement);
    } catch (failure) { if (request === generation.current) setError(message(failure)); }
    finally { checkoutLock.current = false; if (request === generation.current) setPaying(false); }
  };
  const isTrial = subscription?.isTrial || subscription?.subscription?.grantType === 'TRIAL';
  const confirmed = payment?.status === 'SUCCESS';
  const scheduled = subscription?.scheduledSubscription;
  const purchasedPeriod = confirmed ? [scheduled, subscription?.source === 'HOUSEHOLD' && !isTrial ? subscription.subscription : null]
    .find((period) => period && period.id === payment.subscriptionId && period.planCode === payment.planCode) : null;
  const date = (value: string) => new Date(value).toLocaleDateString('vi-VN');
  const planName = (code: string) => code === 'FAMILY_MONTHLY' ? 'Family tháng' : 'Family năm';
  const showCatalogue = !confirmed || showRenewal;

  return <View style={styles.familySection}>
    <Text style={styles.sectionTitle}>Family Plan</Text>
    {loading ? <ActivityIndicator /> : !membership ? <>
      <Text style={styles.featureText}>Tạo hoặc chọn gia đình bạn đang tham gia trước khi chọn gói Family.</Text>
      <TouchableOpacity style={styles.restoreButton} onPress={() => navigation.navigate('FamilyCloud')}><Text style={styles.restoreButtonText}>Tạo hoặc xem gia đình</Text></TouchableOpacity>
    </> : <>
      <Text style={styles.planName}>{membership.household.householdName}</Text>
      {confirmed ? <View style={styles.successCard}>
        <Text accessibilityLiveRegion="polite" style={styles.successTitle}>{paymentMessage(payment)}</Text>
        <Text style={styles.planName}>{planName(payment.planCode)} · {payment.amount.toLocaleString('vi-VN')} {payment.currency}</Text>
        {purchasedPeriod ? <>
          <Text style={styles.featureText}>{purchasedPeriod === scheduled ? 'Gói đã mua sẽ bắt đầu sau thời gian dùng thử.' : 'Gói Family đã được cập nhật cho gia đình bạn.'}</Text>
          <Text style={styles.featureText}>Thời hạn Family: {date(purchasedPeriod.startDate)} – {date(purchasedPeriod.endDate)}</Text>
        </> : <Text style={styles.featureText}>Giao dịch đã hoàn tất. Thông tin gói đang được cập nhật; bạn có thể làm mới Family Plan bên dưới.</Text>}
        <Text style={styles.historyText}>Mã giao dịch: {payment.transactionCode}</Text>
        <Text style={styles.featureText}>Quyền Family được chia sẻ với các thành viên được cấp quyền trong gia đình. Không tự động thu phí khi hết hạn.</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.payButton} onPress={() => navigation.navigate('FamilyCloud')}><Text style={styles.payButtonText}>Về gia đình</Text></TouchableOpacity>
        {subscription?.canManageSubscription && !showRenewal ? <TouchableOpacity accessibilityRole="button" style={styles.restoreButton} onPress={() => setShowRenewal(true)}><Text style={styles.restoreButtonText}>Gia hạn thêm</Text></TouchableOpacity> : null}
      </View> : null}
      <Text style={styles.featureText}>{subscription?.hasPaidAccess ? isTrial ? 'Đang dùng thử Family miễn phí' : 'Gói đang hoạt động' : subscription?.readOnly ? 'Gói đã hết hạn · Dữ liệu chỉ đọc' : 'Chưa có gói Family hiệu lực'}</Text>
      {subscription?.readOnly && subscription.canManageSubscription ? <Text style={styles.featureText}>Bạn vẫn có thể chọn gói và gia hạn bên dưới để tiếp tục sử dụng.</Text> : null}
      {subscription?.source === 'LEGACY_OWNER' ? <Text style={styles.featureText}>Quyền Family hiện được cung cấp từ Premium của chủ gia đình.</Text> : null}
      {subscription?.subscription?.endDate ? <Text style={styles.featureText}>{isTrial ? 'Dùng thử đến' : 'Hết hạn'}: {date(subscription.subscription.endDate)}</Text> : null}
      {scheduled ? <Text style={styles.featureText}>Đã mua {planName(scheduled.planCode)} · Có hiệu lực từ {date(scheduled.startDate)} đến {date(scheduled.endDate)}. Thời gian dùng thử còn lại được giữ nguyên.</Text> : null}
      {subscription && !subscription.canManageSubscription ? <Text style={styles.featureText}>Chỉ chủ gia đình có thể thanh toán hoặc gia hạn. Quyền sử dụng của bạn do chủ gia đình cấp.</Text> : null}
      {subscription?.canManageSubscription && subscription.trialEligibility?.eligible ? <TouchableOpacity accessibilityRole="button" disabled={paying || payment?.status === 'PENDING'} style={styles.restoreButton} onPress={() => void startTrial()}>
        <Text style={styles.restoreButtonText}>{paying ? 'Đang xử lý…' : 'Bắt đầu dùng thử miễn phí 30 ngày'}</Text>
      </TouchableOpacity> : null}
      {showCatalogue ? <>
      {plans.length === 0 ? <Text style={styles.featureText}>Hiện chưa có gói Family khả dụng.</Text> : plans.map((plan) => <TouchableOpacity key={plan._id}
        disabled={!subscription?.canManageSubscription || paying || payment?.status === 'PENDING'} onPress={() => setSelected(plan)}
        style={[styles.planCard, selected?._id === plan._id && styles.planCardSelected]}>
        <Text style={styles.planName}>{plan.planName}</Text>
        <Text style={styles.planPrice}>{plan.price.toLocaleString('vi-VN')} {plan.currency} / {familyPlanPeriod(plan)}</Text>
        {plan.features.map((feature) => <Text key={feature} style={styles.featureText}>• {feature}</Text>)}
        <Text style={styles.featureText}>{plan.limits.maxMembers} thành viên · {plan.limits.maxFoodItems} thực phẩm · {plan.limits.maxStorageLocations} vị trí lưu trữ</Text>
      </TouchableOpacity>)}
      {Platform.OS === 'web' && subscription?.canManageSubscription ? <TouchableOpacity accessibilityRole="button" onPress={checkout}
        disabled={paying || payment?.status === 'PENDING' || !canCheckoutFamily('web', subscription, selected)}
        style={[styles.payButton, (paying || payment?.status === 'PENDING' || !canCheckoutFamily('web', subscription, selected)) && styles.payButtonDisabled]}>
        {paying ? <ActivityIndicator /> : <Text style={styles.payButtonText}>{!isTrial && subscription.subscription && subscription.source === 'HOUSEHOLD' ? 'Gia hạn qua payOS' : 'Thanh toán qua payOS'}</Text>}
      </TouchableOpacity> : Platform.OS !== 'web' ? <Text style={styles.featureText}>Thanh toán Family qua payOS được hỗ trợ trên website. Mua và khôi phục Premium trên ứng dụng vẫn dùng App Store / Google Play.</Text> : null}
      {isTrial && !scheduled ? <Text style={styles.featureText}>Không tự động thu phí. Bạn có thể chọn gói tháng hoặc năm; kỳ trả phí bắt đầu khi hết thời gian dùng thử.</Text>
        : subscription?.hasPaidAccess && subscription.source === 'HOUSEHOLD' ? <Text style={styles.featureText}>Khi gói còn hiệu lực, bạn chỉ có thể gia hạn cùng gói.</Text> : null}
      </> : null}
      {payment && !confirmed ? <View style={styles.historyItem}>
        <Text accessibilityLiveRegion="polite" style={styles.historyTitle}>{paymentMessage(payment)}</Text>
        <Text style={styles.historyText}>{payment.transactionCode} · {payment.amount.toLocaleString('vi-VN')} {payment.currency}</Text>
        {payment.status === 'PENDING' && safeCheckoutUrl(payment.checkoutUrl) && Platform.OS === 'web' ? <TouchableOpacity style={styles.restoreButton} onPress={() => window.open(safeCheckoutUrl(payment.checkoutUrl)!, '_blank', 'noopener,noreferrer')}><Text style={styles.restoreButtonText}>Mở trang thanh toán</Text></TouchableOpacity> : null}
        <TouchableOpacity accessibilityRole="button" disabled={checking} style={styles.restoreButton} onPress={() => void refreshPayment()}><Text style={styles.restoreButtonText}>{checking ? 'Đang kiểm tra…' : 'Kiểm tra trạng thái thanh toán'}</Text></TouchableOpacity>
        {pollingEnded ? <Text style={styles.featureText}>Chưa có kết quả cuối cùng. Bạn có thể kiểm tra lại trạng thái.</Text> : null}
      </View> : null}
    </>}
    {error ? <Text accessibilityLiveRegion="polite" style={styles.errorText}>{error}</Text> : null}
    <TouchableOpacity accessibilityRole="button" disabled={loading || paying} style={styles.restoreButton} onPress={() => reloadPageOrRefresh(load)}><Text style={styles.restoreButtonText}>Làm mới Family Plan</Text></TouchableOpacity>
  </View>;
}
