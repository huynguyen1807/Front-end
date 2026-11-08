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

- Scanning supports tick selection, inline corrections, supplemental scans, quantity-preserving portion splits and reviewed batch saves. Drafts are stored locally per account; successful rows are reconciled with the API to prevent accidental repeats.
- Each item uses a reviewable cropped region. The complete scene remains linked to the purchase batch and is shown in food details. Library images work independently from camera permission.
- Shelf-life reminders distinguish package dates, user-entered dates and sourced reference windows. A reference date does not establish freshness or safety.
- Run `npm run test:scan-review` for the focused review-state tests.

- API base URL comes from `EXPO_PUBLIC_API_URL`
- No standalone shared repo is used
- Types and API contract come from the backend OpenAPI document
