import type { HouseholdSubscription, PayOSPayment, SubscriptionPlan } from '../types/subscription';

export function canCheckoutFamily(platform: string, subscription: HouseholdSubscription | null, plan: SubscriptionPlan | null) {
  return platform === 'web' && Boolean(subscription?.canManageSubscription && plan?.isActive
    && plan.scope === 'HOUSEHOLD' && ['FAMILY_MONTHLY', 'FAMILY_YEARLY'].includes(plan.planCode)
    && plan.currency === 'VND' && Number.isSafeInteger(plan.price) && plan.price > 0
    && (!subscription.scheduledSubscription || subscription.scheduledSubscription.planCode === plan.planCode)
    && (!subscription.hasPaidAccess || subscription.isTrial || subscription.subscription?.grantType === 'TRIAL'
      || subscription.source === 'LEGACY_OWNER' || subscription.subscription?.planCode === plan.planCode));
}

export function familyPlanPeriod(plan: SubscriptionPlan) {
  const months = plan.billingPeriodMonths ?? (plan.planCode === 'FAMILY_MONTHLY' ? 1 : plan.planCode === 'FAMILY_YEARLY' ? 12 : null);
  return months === 1 ? 'tháng' : months === 12 ? 'năm' : `${plan.durationDays ?? 0} ngày`;
}

export function parsePayOSReturnOrder(value: string): number | undefined {
  try {
    const url = new URL(value);
    if (!['/payment/success', '/payment/cancel'].includes(url.pathname.replace(/\/$/, ''))) return undefined;
    const raw = url.searchParams.get('orderCode');
    const order = Number(raw);
    return raw && /^[1-9]\d*$/.test(raw) && Number.isSafeInteger(order) ? order : undefined;
  } catch { return undefined; }
}

export function safeCheckoutUrl(value: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null; }
  catch { return null; }
}

export function parsePendingOrder(value: string | null, householdId: string): number | null {
  try {
    const saved = JSON.parse(value ?? 'null');
    return saved?.householdId === householdId && Number.isSafeInteger(saved.orderCode) && saved.orderCode > 0 ? saved.orderCode : null;
  } catch { return null; }
}

export function paymentMessage(payment: PayOSPayment) {
  switch (payment.status) {
    case 'SUCCESS': return 'Thanh toán thành công';
    case 'FAILED': return 'Thanh toán chưa thành công. Vui lòng thử lại.';
    case 'CANCELLED': return 'Phiên thanh toán đã bị hủy hoặc hết hạn.';
    case 'REFUNDED': return 'Giao dịch đã được hoàn tiền.';
    default: return payment.awaitingProvider
      ? 'Đang cập nhật trạng thái thanh toán. Vui lòng kiểm tra lại sau ít phút.'
      : 'Đang chờ thanh toán. Quay lại ứng dụng sau khi thanh toán để kiểm tra kết quả.';
  }
}
