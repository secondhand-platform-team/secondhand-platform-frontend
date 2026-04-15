"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { itemService, type ItemWithImages, type PaginatedResponse } from "@/config/services/item.service";
import type { ItemRequest } from "@/types/item.type";

type ItemsState = {
  myItems: ItemWithImages[];
  selectedItem: ItemWithImages | null;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  itemLoading: boolean;
  error: string | null;
};

const initialState: ItemsState = {
  myItems: [],
  selectedItem: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  pageSize: 20,
  loading: false,
  itemLoading: false,
  error: null,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export const fetchMyItems = createAsyncThunk<
  PaginatedResponse<ItemWithImages>,
  { page?: number; size?: number },
  { rejectValue: string }
>("items/fetchMyItems", async ({ page = 0, size = 20 }, { rejectWithValue }) => {
  try {
    console.log("🔄 Fetching items from API - page:", page, "size:", size);
    const response = await itemService.getMyItems(page, size);
    console.log("✅ Items fetched successfully:", response);
    return response;
  } catch (error) {
    const errMsg = getErrorMessage(error, "Không thể tải danh sách tin đăng");
    console.error("❌ Error fetching items:", errMsg, error);
    return rejectWithValue(errMsg);
  }
});

export const fetchItemDetail = createAsyncThunk<
  ItemWithImages,
  string,
  { rejectValue: string }
>("items/fetchItemDetail", async (itemId, { rejectWithValue }) => {
  try {
    return await itemService.getItem(itemId);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể tải chi tiết tin đăng"));
  }
});

export const createNewItem = createAsyncThunk<
  ItemWithImages,
  { data: ItemRequest; images?: File[] },
  { rejectValue: string }
>("items/createNewItem", async ({ data, images }, { rejectWithValue }) => {
  try {
    return await itemService.createItem(data, images);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Tạo tin đăng thất bại"));
  }
});

export const updateExistingItem = createAsyncThunk<
  ItemWithImages,
  { itemId: string; data: Partial<ItemRequest> },
  { rejectValue: string }
>("items/updateExistingItem", async ({ itemId, data }, { rejectWithValue }) => {
  try {
    return await itemService.updateItem(itemId, data);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Cập nhật tin đăng thất bại"));
  }
});

export const updateItemStatusThunk = createAsyncThunk<
  ItemWithImages,
  { itemId: string; status: string },
  { rejectValue: string }
>("items/updateItemStatus", async ({ itemId, status }, { rejectWithValue }) => {
  try {
    return await itemService.updateItemStatus(itemId, status);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Cập nhật trạng thái thất bại"));
  }
});

export const deleteItemThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("items/deleteItem", async (itemId, { rejectWithValue }) => {
  try {
    await itemService.deleteItem(itemId);
    return itemId;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Xóa tin đăng thất bại"));
  }
});

export const toggleItemFavorite = createAsyncThunk<
  { itemId: string; isFavorited: boolean },
  { itemId: string; isFavorited: boolean },
  { rejectValue: string }
>("items/toggleFavorite", async ({ itemId, isFavorited }, { rejectWithValue }) => {
  try {
    if (isFavorited) {
      await itemService.removeFavorite(itemId);
    } else {
      await itemService.addFavorite(itemId);
    }
    return { itemId, isFavorited: !isFavorited };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể cập nhật yêu thích"));
  }
});

const itemsSlice = createSlice({
  name: "items",
  initialState,
  reducers: {
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch My Items
    builder
      .addCase(fetchMyItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyItems.fulfilled, (state, action) => {
        console.log("✅ Redux fulfilled - updating state:", {
          loading: false,
          itemsCount: action.payload.content?.length,
          totalElements: action.payload.totalElements,
        });
        state.loading = false;
        state.myItems = Array.isArray(action.payload.content) ? action.payload.content : [];
        state.totalElements = action.payload.totalElements ?? 0;
        state.totalPages = action.payload.totalPages ?? 0;
        state.currentPage = action.payload.currentPage ?? 0;
        state.pageSize = action.payload.pageSize ?? 20;
        state.error = null;
        
        console.log("✅ State updated with items:", {
          myItems_count: state.myItems.length,
          myItems: state.myItems,
          totalElements: state.totalElements,
        });
      })
      .addCase(fetchMyItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi tải dữ liệu";
      });

    // Fetch Item Detail
    builder
      .addCase(fetchItemDetail.pending, (state) => {
        state.itemLoading = true;
        state.error = null;
      })
      .addCase(fetchItemDetail.fulfilled, (state, action) => {
        state.itemLoading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchItemDetail.rejected, (state, action) => {
        state.itemLoading = false;
        state.error = action.payload || "Lỗi tải chi tiết";
      });

    // Create Item
    builder
      .addCase(createNewItem.pending, (state) => {
        state.itemLoading = true;
        state.error = null;
      })
      .addCase(createNewItem.fulfilled, (state, action) => {
        state.itemLoading = false;
        state.myItems.unshift(action.payload);
      })
      .addCase(createNewItem.rejected, (state, action) => {
        state.itemLoading = false;
        state.error = action.payload || "Lỗi tạo tin";
      });

    // Update Item
    builder
      .addCase(updateExistingItem.pending, (state) => {
        state.itemLoading = true;
        state.error = null;
      })
      .addCase(updateExistingItem.fulfilled, (state, action) => {
        state.itemLoading = false;
        const index = state.myItems.findIndex((item) => item.itemId === action.payload.itemId);
        if (index !== -1) {
          state.myItems[index] = action.payload;
        }
        state.selectedItem = action.payload;
      })
      .addCase(updateExistingItem.rejected, (state, action) => {
        state.itemLoading = false;
        state.error = action.payload || "Lỗi cập nhật";
      });

    // Update Status
    builder
      .addCase(updateItemStatusThunk.pending, (state) => {
        state.itemLoading = true;
        state.error = null;
      })
      .addCase(updateItemStatusThunk.fulfilled, (state, action) => {
        state.itemLoading = false;
        const index = state.myItems.findIndex((item) => item.itemId === action.payload.itemId);
        if (index !== -1) {
          state.myItems[index] = action.payload;
        }
        if (state.selectedItem?.itemId === action.payload.itemId) {
          state.selectedItem = action.payload;
        }
      })
      .addCase(updateItemStatusThunk.rejected, (state, action) => {
        state.itemLoading = false;
        state.error = action.payload || "Lỗi cập nhật trạng thái";
      });

    // Delete Item
    builder
      .addCase(deleteItemThunk.pending, (state) => {
        state.itemLoading = true;
        state.error = null;
      })
      .addCase(deleteItemThunk.fulfilled, (state, action) => {
        state.itemLoading = false;
        state.myItems = state.myItems.filter((item) => item.itemId !== action.payload);
        if (state.selectedItem?.itemId === action.payload) {
          state.selectedItem = null;
        }
      })
      .addCase(deleteItemThunk.rejected, (state, action) => {
        state.itemLoading = false;
        state.error = action.payload || "Lỗi xóa";
      });

    // Toggle Favorite
    builder
      .addCase(toggleItemFavorite.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleItemFavorite.fulfilled, (state, action) => {
        const item = state.myItems.find((item) => item.itemId === action.payload.itemId);
        if (item && item.favoriteCount !== undefined) {
          item.favoriteCount += action.payload.isFavorited ? 1 : -1;
        }
      })
      .addCase(toggleItemFavorite.rejected, (state, action) => {
        state.error = action.payload || "Lỗi cập nhật";
      });
  },
});

export const { clearSelectedItem, clearError } = itemsSlice.actions;
export default itemsSlice.reducer;
