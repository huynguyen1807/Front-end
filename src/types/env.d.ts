declare global {
  const process: {
    env: {
      EXPO_PUBLIC_API_URL?: string;
      EXPO_PUBLIC_REVENUECAT_ANDROID_KEY?: string;
      EXPO_PUBLIC_REVENUECAT_IOS_KEY?: string;
      EXPO_PUBLIC_REVENUECAT_TEST_API_KEY?: string;
      EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?: string;
    };
  };
}

export {};
