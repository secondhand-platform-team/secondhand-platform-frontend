import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import http from "../../utils/api";
import type { ItemResponse } from "../../types/item.type";

interface ItemState {
  items: ItemResponse[];
  loading: boolean;
  error: string | null;
}

const initialState: ItemState = {
  items: [],
  loading: false,
  error: null,
};

// 1. Thunk lấy danh sách
export const fetchAllItems = createAsyncThunk<
  ItemResponse[],
  void,
  { rejectValue: string }
>("item/fetchAllItems", async (_, { rejectWithValue }) => {
  try {
    const response = await http.get("/items", {
      headers: { "X-Service": "core" },
    });
    return response as ItemResponse[];
  } catch (error: any) {
    return rejectWithValue(error.message || "Không thể lấy danh sách tin đăng");
  }
});

// 2. Thunk xóa item (Tương ứng với @DeleteMapping("/{itemId}"))
export const deleteItem = createAsyncThunk<
  string, // Trả về itemId đã xóa để cập nhật UI
  string, // Tham số truyền vào là itemId
  { rejectValue: string }
>("item/deleteItem", async (itemId, { rejectWithValue }) => {
  try {
    await http.delete(`/items/${itemId}`, {
      headers: { "X-Service": "core" },
    });
    return itemId; // Trả về ID để lọc khỏi danh sách trong state
  } catch (error: any) {
    return rejectWithValue(error.message || "Không thể xóa tin đăng");
  }
});

// 3. Thunk cập nhật trạng thái item
export const updateItemStatus = createAsyncThunk<
  ItemResponse,
  { itemId: string; status: string },
  { rejectValue: string }
>("item/updateItemStatus", async ({ itemId, status }, { rejectWithValue }) => {
  try {
    const response = await http.patch(`/items/${itemId}/status`, { status }, {
      headers: { "X-Service": "core" },
    });
    return response as ItemResponse;
  } catch (error: any) {
    return rejectWithValue(error.message || "Không thể cập nhật trạng thái");
  }
});

const itemSlice = createSlice({
  name: "item",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Xử lý fetchAllItems
      .addCase(fetchAllItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      })

      // 3. Xử lý deleteItem
      .addCase(deleteItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.loading = false;
        // Lọc bỏ item đã xóa khỏi state.items để UI cập nhật ngay lập tức
        // ItemResponse sử dụng `itemId` làm khóa, không phải `id`.
        state.items = state.items.filter((item) => item.itemId !== action.payload);
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi khi xóa";
      })

      // 4. Xử lý updateItemStatus
      .addCase(updateItemStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateItemStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(i => i.itemId === action.payload.itemId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateItemStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi khi cập nhật trạng thái";
      });
  },
});

export default itemSlice.reducer;