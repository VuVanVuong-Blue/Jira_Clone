# 🚀 Jira Clone - Enterprise Project Management System

![Banner](https://img.shields.io/badge/Project-Jira%20Clone-blue?style=for-the-badge&logo=jira)
![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203.4.1-brightgreen?style=for-the-badge&logo=springboot)
![React](https://img.shields.io/badge/Frontend-React%2019%20+%20Vite-61DAFB?style=for-the-badge&logo=react)
![MySQL](https://img.shields.io/badge/Database-MySQL%208.0-4479A1?style=for-the-badge&logo=mysql)

**Jira Clone** là một hệ thống quản lý dự án hiện đại, được thiết kế để giúp các nhóm phát triển phần mềm theo dõi công việc, quản lý luồng công việc và tăng cường khả năng cộng tác. Lấy cảm hứng từ Atlassian Jira, dự án này cung cấp các tính năng cốt lõi cần thiết cho một quy trình làm việc Agile chuyên nghiệp.

---

## ✨ Tính Năng Chính

### 🛡️ Hệ Thống Bảo Mật & Xác Thực
*   **Xác thực JWT:** Bảo mật API bằng JSON Web Token.
*   **OAuth2 Social Login:** Tích hợp đăng nhập bằng Google.
*   **Quản lý vai trò (RBAC):** Phân quyền người dùng theo Role và Permission (Admin, Project Manager, Member).
*   **Mã xác thực OTP:** Gửi mã xác thực qua email để tăng cường bảo mật.

### 📊 Quản Lý Dự Án & Công Việc
*   **Project Dashboard:** Tạo, chỉnh sửa và quản lý danh sách các dự án.
*   **Issue Management:** Hệ thống quản lý thẻ công việc (Issue) với đầy đủ các thuộc tính (Status, Priority, Type).
*   **Issue Linking:** Kết nối các thẻ công việc có liên quan.
*   **Sprint Management:** Quản lý vòng đời phát triển thông qua các Sprint.

### 🤝 Cộng Tác & Tương Tác
*   **Collaboration:** Tính năng làm việc nhóm, mời thành viên tham gia vào dự án.
*   **Invitation System:** Gửi lời mời gia nhập dự án qua hệ thống.
*   **Real-time Notifications:** Hệ thống thông báo giúp cập nhật tiến độ công việc tức thời.

### 🔍 Quản Trị & Kiểm Soát
*   **Audit Logs:** Theo dõi lịch sử thay đổi và hoạt động của người dùng trên hệ thống.
*   **Health Checks:** Theo dõi trạng thái hoạt động của hệ thống Backend.

---

## 🛠️ Công Nghệ Sử Dụng

### Backend Ecosystem
*   **Language:** Java 17
*   **Framework:** Spring Boot 3.4.1
*   **Security:** Spring Security & JWT (JJWT)
*   **Persistence:** Spring Data JPA + Hibernate
*   **Database:** MySQL 8.0
*   **Messaging:** Spring Mail (tích hợp Brevo API)
*   **Utilities:** Lombok, Maven, Validation API

### Frontend Ecosystem
*   **Framework:** React 19
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS / Vanilla CSS
*   **State Management:** React Hooks, Context API
*   **API Client:** Axios

---

## 🚀 Hướng Dẫn Cài Đặt

### Yêu Cầu Môi Trường
*   **Java SDK:** 17 hoặc cao hơn.
*   **Node.js:** 18.x trở lên.
*   **MariaDB/MySQL:** 8.0+.
*   **Maven:** 3.8+.

### Bước 1: Cấu Hình Database
1. Tạo một database mới trong MySQL (ví dụ: `jira_clone`).
2. Tùy chỉnh các thông số kết nối trong file `.env`.

### Bước 2: Khởi Chạy Backend
```bash
cd jira-clone-backend
# Tạo file .env từ template và điền thông tin
cp .env.example .env
# Chạy dự án bằng Maven
mvn spring-boot:run
```
*Mặc định API sẽ chạy tại: `http://localhost:8080`*

### Bước 3: Khởi Chạy Frontend
```bash
cd jira-clone-frontend
# Cài đặt dependencies
npm install
# Khởi chạy môi trường development
npm run dev
```
*Mặc định ứng dụng sẽ chạy tại: `http://localhost:3000`*

---

## 🗂️ Cấu Trúc Thư Mục

```bash
jira-clone/
├── jira-clone-backend/         # Toàn bộ mã nguồn phía máy chủ
│   ├── src/main/java/.../
│   │   ├── controllers/        # Xử lý các endpoint REST API
│   │   ├── services/           # Logic nghiệp vụ chính
│   │   ├── models/             # Định nghĩa Entities và DTOs
│   │   ├── security/           # Cấu hình bảo mật và Filter
│   │   └── repositories/       # Tương tác với cơ sở dữ liệu (JPA)
│   └── .env.example            # Mẫu file cấu hình môi trường
│
└── jira-clone-frontend/        # Mã nguồn phía giao diện người dùng
    ├── src/
    │   ├── pages/              # Các trang chính của ứng dụng
    │   ├── components/         # Các thành phần giao diện tái sử dụng
    │   └── services/           # Quản lý lời gọi API (Axios)
    └── index.html              # Entry point của ứng dụng
```

---

## 🔑 Biến Môi Trường (Environment Variables)

Hãy đảm bảo rằng bạn đã thiết lập đầy đủ các biến môi trường sau trong file `.env`:

| Biến | Mô tả |
| :--- | :--- |
| `DB_URL` | Đường dẫn kết nối MySQL (e.g., `jdbc:mysql://localhost:3306/jira_clone`) |
| `DB_USERNAME` | Tên người dùng MySQL |
| `DB_PASSWORD` | Mật khẩu MySQL |
| `JWT_SECRET` | Chuỗi khóa bí mật dùng để ký JWT |
| `GOOGLE_CLIENT_ID` | OAuth Client ID từ Google Cloud Console |
| `BREVO_API_KEY` | API Key từ Brevo để gửi Email |

---


