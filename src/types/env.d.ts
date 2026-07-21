declare global {
  const process: {
    env: {
      EXPO_PUBLIC_API_URL?: string;
    };
  };
}

export {};
