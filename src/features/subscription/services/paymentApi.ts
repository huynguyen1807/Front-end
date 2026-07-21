import { apiClient } from '../../../services/apiClient';
import { CurrentSubscription, PaymentTransaction, SubscriptionPlan } from '../types/subscription';

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
