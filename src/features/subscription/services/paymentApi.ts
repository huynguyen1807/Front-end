import { apiClient } from '../../../services/apiClient';
import { CurrentSubscription, PaymentTransaction, SubscriptionPlan, FamilyPlanCode, HouseholdSubscription, PayOSPayment } from '../types/subscription';

export const getSubscriptionPlansApi = async (): Promise<SubscriptionPlan[]> => {
  const res = await apiClient.get('/api/subscriptions/plans');
  return res.data;
};
export const getCurrentSubscriptionApi = async (): Promise<CurrentSubscription> => {
  const res = await apiClient.get('/api/subscriptions/current');
  return res.data;
};
export const getPaymentHistoryApi = async (): Promise<PaymentTransaction[]> => {
  const res = await apiClient.get('/api/payments/history');
  return res.data.data;
};

export const getFamilyPlansApi = async (): Promise<SubscriptionPlan[]> => {
  const res = await apiClient.get('/api/subscriptions/plans', { params: { scope: 'HOUSEHOLD' } });
  return res.data;
};

export const getHouseholdSubscriptionApi = async (householdId: string): Promise<HouseholdSubscription> => {
  const res = await apiClient.get(`/api/households/${householdId}/subscription`);
  return res.data.data;
};

export const startFamilyTrialApi = async (householdId: string): Promise<void> => {
  await apiClient.post(`/api/households/${householdId}/subscription/trial`);
};

export const createPayOSCheckoutApi = async (householdId: string, planCode: FamilyPlanCode): Promise<PayOSPayment> => {
  const res = await apiClient.post('/api/payments/payos/checkout', { householdId, planCode });
  return res.data.data;
};

export const getPayOSPaymentStatusApi = async (orderCode: number): Promise<PayOSPayment> => {
  const res = await apiClient.get(`/api/payments/${orderCode}/status`);
  return res.data.data;
};
