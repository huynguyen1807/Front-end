# FreshFriends trên Expo Go

Ứng dụng dùng Expo SDK 57. Cài Expo Go phiên bản hỗ trợ SDK 57 trên điện thoại. Trên Android, lấy bản tương ứng tại https://expo.dev/go. Trên iPhone thật, bản Expo Go từ App Store chỉ hỗ trợ đến SDK 54; dùng `eas go` để cài bản SDK 57 qua TestFlight, hoặc dùng development build.

## Chạy trên điện thoại

1. Chạy backend trong thư mục `Back-end`: `npm install`, cấu hình các biến môi trường của backend, rồi `npm run dev`. Backend lắng nghe cổng 4000 trên `0.0.0.0`.
2. Trong thư mục `Front-end`, chạy `npm ci` và `npm start`. Quét mã QR bằng Expo Go. Điện thoại và máy tính cần cùng mạng LAN.
3. Nếu API không tự kết nối được, tạo `Front-end/.env.local` với `EXPO_PUBLIC_API_URL=http://<IP_LAN_CUA_MAY_TINH>:4000`, rồi khởi động lại Expo. Không dùng `localhost` làm API URL trên điện thoại. Nếu dùng Expo tunnel hoặc hai thiết bị khác mạng, đặt biến này thành địa chỉ HTTPS truy cập được từ điện thoại.

`npm run android` / `npm run ios` mở Expo Go trên máy ảo. `npm run typecheck` kiểm tra TypeScript.

## Giới hạn của Expo Go

- Màn Premium hiển thị thông tin gói và lịch sử từ backend. Mua hàng và khôi phục giao dịch qua RevenueCat cần development build; chạy `npm run dev-client` sau khi đã tạo build theo `eas.json`.
- Remote push notification không hoạt động trong Expo Go từ SDK 53. Để kiểm thử push, dùng development build.
- Các biến `EXPO_PUBLIC_REVENUECAT_*` dành cho RevenueCat trong development build. Không đặt khóa bí mật vào biến `EXPO_PUBLIC_*`.
