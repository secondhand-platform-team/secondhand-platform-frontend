# 📋 Tài liệu API: Hệ thống Hết hạn & Gia hạn Tin đăng

> **Dành cho:** Frontend Developer  
> **Backend service:** `core-service` (port 8082, qua Kong: `/core/api/items`)  
> **Cập nhật lần cuối:** 2026-05-30

---

## 📌 Tổng quan

Mỗi tin đăng sau khi được duyệt sẽ có **thời hạn hiển thị**:

| Loại tin | Thời hạn |
|----------|----------|
| `FREE_SELL` (miễn phí có slot) | **5 ngày** |
| `GIVE_AWAY` (cho tặng) | **5 ngày** |
| `SELL` (tính phí — ví hoặc VNPay) | **15 ngày** |

Khi **hết hạn**:
- Tin tự động chuyển sang `status = HIDDEN`
- Seller nhận **notification** trong app
- Seller có thể **gia hạn** để tin hiển thị lại

---

## 🆕 Field mới trong ItemResponse

Tất cả response trả về từ các API liên quan đến item đều có thêm field:

```json
{
  "itemId": "ITM-xxx",
  "title": "...",
  "status": "ACTIVE",
  "transactionType": "SELL",
  "expiredAt": "2026-06-14T13:00:00",
  "paymentUrl": null,
  ...
}
```

| Field | Type | Mô tả |
|-------|------|--------|
| `expiredAt` | `string (ISO 8601)` hoặc `null` | Thời điểm tin đăng hết hạn. `null` nếu chưa kích hoạt (DRAFT) |
| `paymentUrl` | `string` hoặc `null` | Link VNPay khi gia hạn bằng VNPAY. FE cần redirect đến đây |

### Cách hiển thị thời hạn còn lại

```javascript
function getRemainingDays(expiredAt) {
  if (!expiredAt) return null;
  const diff = new Date(expiredAt) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0; // 0 = đã hết hạn
}

// Ví dụ
const days = getRemainingDays(item.expiredAt);
// Hiển thị: "Còn 3 ngày" hoặc "Đã hết hạn"
```

---

## 🔁 API Gia hạn Tin đăng

### `POST /api/items/{itemId}/renew`

Gia hạn tin đăng đang bị ẩn do hết hạn.

**Auth:** ✅ Bắt buộc (Bearer token) — chỉ chủ tin mới được gia hạn

**Điều kiện:** Item phải có `status = "HIDDEN"`

---

### Trường hợp 1: Tin miễn phí (`FREE_SELL` / `GIVE_AWAY`)

Không cần body hoặc body rỗng. Luôn miễn phí.

```http
POST /api/items/ITM-abc123/renew
Authorization: Bearer {token}
```

**Response thành công (`200`):**
```json
{
  "itemId": "ITM-abc123",
  "status": "ACTIVE",
  "expiredAt": "2026-06-04T13:00:00",
  ...
}
```

➡️ FE hiển thị toast "Gia hạn thành công! Tin đăng đã được hiển thị lại."

---

### Trường hợp 2: Tin tính phí (`SELL`) — **Thanh toán bằng Ví**

```http
POST /api/items/ITM-abc123/renew
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentMethod": "WALLET"
}
```

**Response thành công (`200`):**
```json
{
  "itemId": "ITM-abc123",
  "status": "ACTIVE",
  "expiredAt": "2026-06-14T13:00:00",
  ...
}
```

**Response lỗi — Số dư không đủ (`400`):**
```json
{
  "message": "Gia hạn bằng ví thất bại (có thể số dư không đủ): ..."
}
```

➡️ FE cần kiểm tra số dư ví trước (API `GET /api/wallet/balance`) và hiển thị thông báo phù hợp.

---

### Trường hợp 3: Tin tính phí (`SELL`) — **Thanh toán qua VNPay**

```http
POST /api/items/ITM-abc123/renew
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentMethod": "VNPAY"
}
```

**Response thành công (`200`) — trả về paymentUrl:**
```json
{
  "itemId": "ITM-abc123",
  "status": "HIDDEN",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_...",
  "expiredAt": "2026-05-30T13:00:00",
  ...
}
```

> ⚠️ `status` vẫn là `HIDDEN` — tin chưa được gia hạn. Chỉ ACTIVE sau khi VNPay callback thành công.

**FE cần:**
```javascript
const res = await renewItem(itemId, { paymentMethod: "VNPAY" });
if (res.paymentUrl) {
  window.location.href = res.paymentUrl; // redirect đến VNPay
}
```

---

### VNPay Callback sau gia hạn

Sau khi thanh toán VNPay xong, hệ thống tự động xử lý.

- **Thành công** → VNPay redirect đến: `{FRONTEND_URL}/renew-success?status=success&transactionId=...`
- **Thất bại** → VNPay redirect đến: `{FRONTEND_URL}/renew-failed?status=error&message=...`

FE cần tạo 2 route:
- `/renew-success` — hiển thị "Gia hạn thành công!" và refresh thông tin item
- `/renew-failed` — hiển thị lỗi và cho phép thử lại

---

### Các lỗi thường gặp

| HTTP | Thông điệp | Nguyên nhân | Xử lý FE |
|------|-----------|-------------|-----------|
| `400` | "Chỉ có thể gia hạn tin đang bị ẩn..." | Item không phải HIDDEN | Không hiển thị nút Gia hạn |
| `400` | "Bạn không có quyền gia hạn..." | Không phải chủ tin | Ẩn nút Gia hạn với user khác |
| `400` | "số dư không đủ" | Ví thiếu tiền | Hỏi đổi sang VNPAY |
| `400` | "Phương thức thanh toán không hợp lệ..." | Giá trị sai | Dev bug, kiểm tra code |

---

## 🎨 Gợi ý UI/UX

### Hiển thị thời hạn trên card tin đăng

```
┌─────────────────────────────────────────┐
│  [Ảnh sản phẩm]                         │
│  iPhone 15 Pro Max                       │
│  25.000.000 đ                           │
│                                         │
│  📅 Còn 3 ngày  •  👁 142 lượt xem     │
└─────────────────────────────────────────┘
```

**Color coding theo số ngày còn lại:**
```javascript
function getExpiryColor(expiredAt) {
  const days = getRemainingDays(expiredAt);
  if (days === 0) return 'red';    // Đã hết hạn
  if (days <= 1) return 'red';     // Hết hạn hôm nay / ngày mai
  if (days <= 3) return 'orange';  // Sắp hết hạn
  return 'green';                  // Còn nhiều ngày
}
```

### Modal Gia hạn

Hiển thị khi seller bấm "Gia hạn" trên tin đang HIDDEN:

```
┌──────────────────────────────────────────┐
│  🔄 Gia hạn tin đăng                    │
│                                          │
│  Tin: "iPhone 15 Pro Max"                │
│  Phí gia hạn: 50.000 đ / 15 ngày        │
│  Số dư ví: 120.000 đ ✅                 │
│                                          │
│  Phương thức:                            │
│  ○ Ví (còn 120.000 đ)  ← recommend     │
│  ○ VNPay                                 │
│                                          │
│  [Hủy]            [Xác nhận gia hạn]    │
└──────────────────────────────────────────┘
```

**Logic hiển thị:**
- Nếu `transactionType === "FREE_SELL"` hoặc `"GIVE_AWAY"` → Ẩn phần phí, hiển thị "Miễn phí"
- Nếu `transactionType === "SELL"` → Hiển thị phí gia hạn (bằng `posting_fee` của category)
- Nếu số dư ví < phí → Disable nút WALLET, hiển thị warning đỏ

---

## 📡 Danh sách API liên quan

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/items/me` | Lấy danh sách tin của tôi (bao gồm HIDDEN) |
| `GET` | `/api/items/{itemId}` | Chi tiết tin (có `expiredAt`) |
| `POST` | `/api/items/{itemId}/renew` | **Gia hạn tin** (mới) |
| `GET` | `/api/items/payment-renew-callback` | Callback VNPay gia hạn (backend tự xử lý) |
| `GET` | `/api/wallet/balance` | Kiểm tra số dư ví |

---

## 💡 Checklist cho FE Developer

- [ ] Thêm hiển thị `expiredAt` (thời gian hết hạn) trên card tin đăng
- [ ] Badge "Sắp hết hạn" khi `expiredAt < now + 3 ngày`
- [ ] Badge "Đã hết hạn" khi `status === "HIDDEN"` và `expiredAt < now`
- [ ] Nút **"Gia hạn"** hiển thị trên các tin có `status === "HIDDEN"` của chính user
- [ ] Modal gia hạn: chọn WALLET hoặc VNPAY
- [ ] Xử lý redirect khi chọn VNPAY (`paymentUrl` trong response)
- [ ] Tạo route `/renew-success` và `/renew-failed`
- [ ] Refresh thông tin tin đăng sau khi gia hạn thành công
- [ ] Thông báo toast khi gia hạn thành công / thất bại
