import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import { appConfig } from '../../../config/env';

let configuredUserId: string | null = null;
let initializationPromise: Promise<void> | null = null;

function getApiKey() {
  const key = appConfig.revenueCatTestKey || (Platform.OS === 'ios'
    ? appConfig.revenueCatIosKey
    : appConfig.revenueCatAndroidKey);
  if (!key) throw new Error('RevenueCat API key chưa được cấu hình');
  return key;
}

export async function initializeRevenueCat(appUserId: string) {
  if (!appUserId) throw new Error('Không xác định được RevenueCat App User ID');

  if (!initializationPromise) {
    initializationPromise = (async () => {
      const isConfigured = await Purchases.isConfigured();
      if (!isConfigured) {
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
        Purchases.configure({ apiKey: getApiKey(), appUserID: appUserId });
        configuredUserId = appUserId;
        return;
      }

      const currentAppUserId = await Purchases.getAppUserID();
      if (currentAppUserId !== appUserId) await Purchases.logIn(appUserId);
      configuredUserId = appUserId;
    })().finally(() => {
      initializationPromise = null;
    });
  }

  await initializationPromise;

  // A second account may request initialization while the first initialization is in flight.
  if (configuredUserId !== appUserId) {
    await Purchases.logIn(appUserId);
    configuredUserId = appUserId;
  }
}

export async function getRevenueCatPackages() {
  const offerings = await Purchases.getOfferings();
  const offering = offerings.current ?? offerings.all.default;
  if (!offering) throw new Error('RevenueCat chưa có Offering hiện hành');
  if (offering.availablePackages.length === 0) {
    throw new Error('Offering RevenueCat hiện hành chưa có package nào');
  }
  return offering.availablePackages;
}

export async function purchaseRevenueCatPackage(selectedPackage: PurchasesPackage) {
  await Purchases.purchasePackage(selectedPackage);
  await Purchases.invalidateCustomerInfoCache();
  return Purchases.getCustomerInfo();
}

export async function restoreRevenueCatPurchases() {
  return Purchases.restorePurchases();
}

export async function logOutRevenueCat() {
  if (await Purchases.isConfigured()) {
    await Purchases.logOut();
    configuredUserId = null;
  }
}

export function hasPremiumEntitlement(customerInfo: any) {
  return Boolean(customerInfo.entitlements.active[appConfig.revenueCatEntitlementId]);
}

export function getActiveEntitlementIds(customerInfo: any): string[] {
  return Object.keys(customerInfo?.entitlements?.active ?? {});
}
