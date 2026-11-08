# Frontend Repo

Expo app for Smart Household Food Management System.

## Run

```bash
npm install
npm start
```

On web, the root page shows the FreshFriends introduction. Use **Đăng nhập** to open the existing sign-in screen. Android and iOS continue to open the app's sign-in screen directly.

## Run on a phone

This app uses native modules, including RevenueCat, so Expo Go cannot run it. Install a development build of the app on the phone and open the Metro QR code with that build. Rebuild the development client after changing the Expo SDK or native dependencies.

For an iPhone, create the development build with EAS:

```bash
npx eas-cli@latest build --profile development --platform ios
```

## Notes

- API base URL comes from `EXPO_PUBLIC_API_URL`
- No standalone shared repo is used
- Types and API contract come from the backend OpenAPI document
