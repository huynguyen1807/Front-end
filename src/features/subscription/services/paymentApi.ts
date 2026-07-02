import { apiClient } from "../../../services/apiClient";
import {
  CreatePaymentResponse,
  CurrentSubscription,
  PaymentTransaction,
  PlanCode,
  SubscriptionPlan,
} from "../types/subscription";

export const getSubscriptionPlansApi = async (): Promise<SubscriptionPlan[]> => {
  const res = await apiClient.get("/api/subscriptions/plans");
  return res.data;
};

export const getCurrentSubscriptionApi = async (): Promise<CurrentSubscription> => {
  const res = await apiClient.get("/api/subscriptions/current");
  return res.data;
};

export const createSandboxPaymentApi = async (
  planCode: Exclude<PlanCode, "FREE">
): Promise<CreatePaymentResponse> => {
  const res = await apiClient.post("/api/payments/create", { planCode });
  return res.data.data;
};

export const markSandboxPaymentSuccessApi = async (
  transactionCode: string
): Promise<CreatePaymentResponse> => {
  const res = await apiClient.post(`/api/payments/sandbox-success/${transactionCode}`);
  return res.data.data;
};

export const getPaymentHistoryApi = async (): Promise<PaymentTransaction[]> => {
  const res = await apiClient.get("/api/payments/history");
  return res.data.data;
};
