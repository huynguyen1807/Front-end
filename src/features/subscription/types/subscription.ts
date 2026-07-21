export type PlanCode = "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_YEARLY";

export interface SubscriptionLimits {
  maxStorageLocations: number;
  maxFoodItems: number;
  familyCloudEnabled: boolean;
  macroReportEnabled: boolean;
  multiStorageEnabled: boolean;
}

export interface SubscriptionPlan {
  _id: string;
  planName: string;
  planCode: PlanCode;
  price: number;
  currency: "VND" | "USD";
  durationDays: number;
  limits: SubscriptionLimits;
  features: string[];
  isActive: boolean;
}

export interface CurrentSubscription {
  appUserId: string;
  _id?: string;
  planId?: SubscriptionPlan | string;
  planCode: PlanCode;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING";
  startDate?: string;
  endDate?: string;
  isPremium: boolean;
  limits?: SubscriptionLimits;
}

export interface PaymentTransaction {
  _id: string;
  transactionCode: string;
  amount: number;
  currency: "VND" | "USD";
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";
  paymentGateway: "REVENUECAT" | "SANDBOX" | "MOMO" | "VNPAY" | "STRIPE";
  paymentMethod: "IN_APP_PURCHASE" | "SANDBOX" | "BANK_CARD" | "E_WALLET";
  paymentUrl?: string;
  paidAt?: string;
  createdAt: string;
  planId?: SubscriptionPlan | string;
}

