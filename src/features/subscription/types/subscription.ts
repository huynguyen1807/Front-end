import type { MemberPermission } from '../../familyCloud/types/familyCloud';

export type IndividualPlanCode = "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_YEARLY";
export type FamilyPlanCode = "FAMILY_MONTHLY" | "FAMILY_YEARLY";
export type PlanCode = IndividualPlanCode | FamilyPlanCode;

export interface SubscriptionLimits {
  maxMembers?: number;
  maxStorageLocations: number;
  maxFoodItems: number;
  familyCloudEnabled: boolean;
  macroReportEnabled: boolean;
  multiStorageEnabled: boolean;
}

export interface SubscriptionPlan {
  scope?: 'USER' | 'HOUSEHOLD';
  _id: string;
  planName: string;
  planCode: PlanCode;
  price: number;
  currency: "VND" | "USD";
  durationDays?: number;
  billingPeriodMonths?: 1 | 12;
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
  paymentGateway: "REVENUECAT" | "PAYOS" | "SANDBOX" | "MOMO" | "VNPAY" | "STRIPE";
  paymentMethod: "IN_APP_PURCHASE" | "BANK_TRANSFER" | "SANDBOX" | "BANK_CARD" | "E_WALLET";
  paymentUrl?: string;
  paidAt?: string;
  createdAt: string;
  planId?: SubscriptionPlan | string;
}

export interface HouseholdSubscriptionPeriod {
  id: string;
  planCode: PlanCode;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  grantType?: 'TRIAL' | 'PAID';
}

export interface HouseholdSubscription {
  householdId: string;
  ownerId: string;
  source: 'HOUSEHOLD' | 'LEGACY_OWNER' | 'NONE';
  subscription: HouseholdSubscriptionPeriod | null;
  scheduledSubscription?: HouseholdSubscriptionPeriod | null;
  isTrial?: boolean;
  hasFamilyAccess?: boolean;
  trialEligibility?: { eligible: boolean; reason: string };
  hasPaidAccess: boolean;
  canReadSharedData: boolean;
  readOnly: boolean;
  capabilities: { familyCloudEnabled: boolean; multiStorageEnabled: boolean };
  limits: SubscriptionLimits | null;
  memberPermission: MemberPermission;
  canManageSubscription: boolean;
  accessReason: string;
}

export interface PayOSPayment {
  orderCode: number;
  transactionCode: string;
  householdId: string;
  planCode: FamilyPlanCode;
  amount: number;
  currency: 'VND';
  status: PaymentTransaction['status'];
  providerStatus?: string;
  checkoutUrl: string | null;
  subscriptionId: string | null;
  paidAt?: string;
  awaitingProvider: boolean;
}

