# FreshFriends trên Expo Go

Ứng dụng dùng Expo SDK 57. Cài Expo Go phiên bản hỗ trợ SDK 57 trên điện thoại. Trên Android, lấy bản tương ứng tại https://expo.dev/go. Trên iPhone thật, bản Expo Go từ App Store chỉ hỗ trợ đến SDK 54; dùng `eas go` để cài bản SDK 57 qua TestFlight, hoặc dùng development build.

## Chạy trên điện thoại

1. Chạy backend trong thư mục `Back-end`: `npm install`, cấu hình các biến môi trường của backend, rồi `npm run dev`. Backend lắng nghe cổng 4000 trên `0.0.0.0`.
2. Trong thư mục `Front-end`, chạy `npm ci` và `npm start`. Quét mã QR bằng Expo Go. Điện thoại và máy tính cần cùng mạng LAN.
3. Nếu API không tự kết nối được, tạo `Front-end/.env.local` với `EXPO_PUBLIC_API_URL=http://<IP_LAN_CUA_MAY_TINH>:4000`, rồi khởi động lại Expo. Không dùng `localhost` làm API URL trên điện thoại. Nếu dùng Expo tunnel hoặc hai thiết bị khác mạng, đặt biến này thành địa chỉ HTTPS truy cập được từ điện thoại.

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
