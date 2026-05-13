# Chức Năng Báo Cáo Bài Viết (Report Item)

## Tổng quan

Chức năng báo cáo cho phép người dùng báo cáo các bài viết vi phạm quy định, giả mạo, gian lận hoặc các vấn đề khác.

## Các thành phần

### 1. Types (`src/types/item.type.ts`)

```typescript
export type ReportCode =
  | "FRAUD"
  | "COUNTERFEIT"
  | "FORBIDDEN"
  | "WRONG_CAT"
  | "SOLD_OUT";
export type ReportStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";

export interface ReportRequest {
  code: ReportCode;
  reason: string;
  description?: string;
  itemId: string;
}

export interface ReportResponse {
  reportId: string;
  itemId: string;
  userId: string;
  code: ReportCode;
  reason: string;
  description?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt?: string;
}
```

### 2. Service Layer (`src/stores/slices/items.slice.ts`)

```typescript
class ItemService {
  async reportItem(data: ReportRequest) {
    return http.post<ReportResponse>(`core/api/items/reports`, data);
  }
}
```

### 3. Redux Thunk

```typescript
export const reportItemThunk = createAsyncThunk<
  ReportResponse,
  ReportRequest,
  { rejectValue: string }
>("items/reportItem", async (reportData, { rejectWithValue }) => {
  try {
    return await itemService.reportItem(reportData);
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Không thể báo cáo bài viết"),
    );
  }
});
```

### 4. Modal Component (`src/components/item/ReportItemModal.tsx`)

Component modal để báo cáo bài viết với các field:

- **Lý do báo cáo** (select): FRAUD, COUNTERFEIT, FORBIDDEN, WRONG_CAT, SOLD_OUT
- **Mô tả ngắn** (text input): Bắt buộc, 10-200 ký tự
- **Mô tả chi tiết** (textarea): Tuỳ chọn, tối đa 500 ký tự

### 5. Hook (`src/hooks/useReportItem.ts`)

Hook tiện lợi để quản lý state của modal báo cáo.

## Cách sử dụng

### Trong Component

```tsx
"use client";

import { useReportItem } from "@/hooks/useReportItem";
import { Button } from "antd";
import { Flag } from "lucide-react";

export default function ProductDetail({ itemId }: { itemId: string }) {
  const { openReportModal, ReportModal } = useReportItem();

  return (
    <div>
      {/* Nội dung chi tiết bài viết */}

      <Button
        type="text"
        danger
        icon={<Flag size={18} />}
        onClick={() => openReportModal(itemId)}
      >
        Báo cáo bài viết
      </Button>

      <ReportModal />
    </div>
  );
}
```

### Dispatch trực tiếp

```tsx
import { reportItemThunk } from "@/stores/slices/items.slice";
import { useAppDispatch } from "@/stores/hooks";

export default function SomeComponent() {
  const dispatch = useAppDispatch();

  const handleReport = async () => {
    try {
      await dispatch(
        reportItemThunk({
          code: "FRAUD",
          reason: "Bài viết này là gian lận",
          description: "Chi tiết thêm...",
          itemId: "item-123",
        }),
      ).unwrap();
    } catch (error) {
      console.error("Report failed:", error);
    }
  };

  return <button onClick={handleReport}>Report</button>;
}
```

## API Endpoint

**POST** `/core/api/items/reports`

### Request Body

```json
{
  "code": "FRAUD",
  "reason": "Bài viết này vi phạm quy định",
  "description": "Chi tiết thêm (tuỳ chọn)",
  "itemId": "item-123"
}
```

### Response

```json
{
  "reportId": "report-456",
  "itemId": "item-123",
  "userId": "user-789",
  "code": "FRAUD",
  "reason": "Bài viết này vi phạm quy định",
  "status": "PENDING",
  "createdAt": "2024-05-11T10:30:00Z"
}
```

## Lý do báo cáo

| Code        | Mô tả                                                   |
| ----------- | ------------------------------------------------------- |
| FRAUD       | Gian lận - Bài viết hoặc người bán không đáng tin cậy   |
| COUNTERFEIT | Hàng giả - Sản phẩm không phải hàng chính hãng          |
| FORBIDDEN   | Nội dung bị cấm - Bài viết chứa nội dung không phù hợp  |
| WRONG_CAT   | Sai danh mục - Bài viết được đăng ở danh mục không đúng |
| SOLD_OUT    | Đã bán/Hết hàng - Sản phẩm không còn sẵn                |

## Trạng thái báo cáo

| Status    | Mô tả                               |
| --------- | ----------------------------------- |
| PENDING   | Báo cáo đang chờ xử lý              |
| REVIEWING | Đang được xem xét bởi quản trị viên |
| RESOLVED  | Báo cáo đã được xử lý               |
| REJECTED  | Báo cáo bị từ chối                  |

## Tích hợp vào Component có sẵn

### ProductCard

Thêm nút báo cáo vào ProductCard:

```tsx
import { useReportItem } from "@/hooks/useReportItem";
import { Flag } from "lucide-react";

export default function ProductCard({ product }: { product: ItemWithImages }) {
  const { openReportModal, ReportModal } = useReportItem();

  return (
    <div className="card">
      {/* Card content */}

      <Button
        size="small"
        type="text"
        danger
        icon={<Flag size={16} />}
        onClick={() => openReportModal(product.itemId)}
      >
        Báo cáo
      </Button>

      <ReportModal />
    </div>
  );
}
```

## Error Handling

Các lỗi có thể xảy ra:

```typescript
try {
  await dispatch(reportItemThunk(reportData)).unwrap();
} catch (error) {
  // error là string message từ backend
  if (error.includes("already reported")) {
    // Bài viết đã được báo cáo
  } else if (error.includes("not found")) {
    // Bài viết không tồn tại
  }
}
```

## Notes

- Một người dùng có thể báo cáo cùng một bài viết nhiều lần (hoặc backend có thể giới hạn)
- Báo cáo phải được quản trị viên xem xét trước khi hành động
- Người dùng sẽ nhận được thông báo thành công sau khi gửi báo cáo
