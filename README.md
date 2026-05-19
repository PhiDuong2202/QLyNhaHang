# QuanAn - Ứng dụng Quản lý Nhà hàng

## Mô tả dự án
QuanAn là một ứng dụng web full-stack để quản lý nhà hàng, bao gồm quản lý bàn ăn, thực đơn, đơn hàng, khách hàng và đánh giá. Dự án được xây dựng với backend sử dụng Laravel (PHP) và frontend sử dụng React (JavaScript).

## Tính năng chính
- Quản lý bàn ăn và đặt bàn
- Quản lý thực đơn và sản phẩm
- Xử lý đơn hàng và thanh toán
- Quản lý khách hàng và nhân viên
- Hệ thống đánh giá và phản hồi
- Giao diện thân thiện cho admin và staff

## Công nghệ sử dụng
- **Backend**: Laravel 12, PHP 8.2+, MySQL
- **Frontend**: React 19, Vite, Ant Design, Tailwind CSS
- **Authentication**: Laravel Sanctum
- **CI/CD**: GitHub Actions

## Cài đặt và chạy dự án

### Yêu cầu hệ thống
- PHP >= 8.2
- Composer
- Node.js >= 18
- MySQL
- Git

### Cài đặt Backend (Laravel)
1. Di chuyển vào thư mục `back`:
   ```
   cd back
   ```
2. Cài đặt dependencies:
   ```
   composer install
   ```
3. Sao chép file môi trường:
   ```
   cp .env.example .env
   ```
4. Tạo key ứng dụng:
   ```
   php artisan key:generate
   ```
5. Cấu hình database trong `.env` (MySQL):
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=quan_an
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```
6. Chạy migrations:
   ```
   php artisan migrate
   ```
7. Chạy seeders để thêm dữ liệu mẫu:
   ```
   php artisan db:seed
   ```
   Sau khi chạy lệnh trên, bạn có thể sử dụng các tài khoản mặc định sau để đăng nhập:
   - **Tài khoản Admin:** `admin@admin.com` / Mật khẩu: `123456`
   - **Tài khoản Staff:** `staff@admin.com` / Mật khẩu: `123456`
8. Khởi chạy server:
   ```
   php artisan serve
   ```
   Server sẽ chạy tại `http://localhost:8000`

### Cài đặt Frontend (React)
1. Di chuyển vào thư mục `front`:
   ```
   cd front
   ```
2. Cài đặt dependencies:
   ```
   npm install
   ```
3. Khởi chạy development server:
   ```
   npm run dev
   ```
   Frontend sẽ chạy tại `http://localhost:5173`

   Trang quản lý chạy tại `http://localhost:5173/admin`
   Trang nhân viên chạy tại `http://localhost:5173/staff` (Đăng nhập với tài khoản mật khẩu đã nếu trên)
### Chạy cả hai cùng lúc
Sử dụng script trong `back/composer.json`:
```
composer run dev
```
Điều này sẽ khởi chạy cả backend và frontend cùng lúc.

## Cấu trúc dự án
```
QuanAn/
├── back/                 # Backend Laravel
│   ├── app/              # Code ứng dụng
│   ├── database/         # Migrations, seeders
│   ├── public/           # Public assets
│   ├── routes/           # API routes
│   └── ...
├── front/                # Frontend React
│   ├── src/              # Source code
│   ├── public/           # Static files
│   └── ...
├── .github/              # CI/CD workflows
└── README.md             # File này
```

## API Documentation
API endpoints chính:
- `/api/categories` - Quản lý danh mục
- `/api/products` - Quản lý sản phẩm
- `/api/orders` - Quản lý đơn hàng
- `/api/tables` - Quản lý bàn ăn
- `/api/customers` - Quản lý khách hàng

## Đóng góp
1. Fork repository
2. Tạo branch mới: `git checkout -b feature/ten-tinh-nang`
3. Commit thay đổi: `git commit -m 'Thêm tính năng mới'`
4. Push lên branch: `git push origin feature/ten-tinh-nang`
5. Tạo Pull Request

## Tác giả
- **PhiDuong2202** - [GitHub](https://github.com/PhiDuong2202)

## Giấy phép
Dự án này sử dụng giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.
