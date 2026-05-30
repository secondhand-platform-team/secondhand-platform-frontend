"use client";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "@/utils/api";
import type { ItemRequest, ItemResponse, ItemWithImages, PaginatedResponse, ReportRequest, ReportResponse } from "@/types/item.type";

export interface SearchParams {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  transactionType?: string;
  city?: string;
  district?: string;
  ward?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

class ItemService {
  async createItem(data: ItemRequest, images?: File[]) {
    if (images && images.length > 0) {
      const formData = new FormData();
      formData.append("item", new Blob([JSON.stringify(data)], { type: "application/json" }));
      images.forEach((image) => {
        formData.append("images", image);
      });
      return http.post<ItemResponse>("core/api/items", formData);
    }
    return http.post<ItemResponse>("core/api/items/json", data as unknown as Record<string, unknown>);
  }

  async getItem(itemId: string) {
    const response = await http.get<ItemResponse>(`core/api/items/${itemId}`);
    return {
      ...response,
      images: response.itemImageList || [],
      favoriteCount: response.favoriteCount ?? 0,
      isFavorited: response.isFavorited ?? false,
      viewCount: 0,
    } as ItemWithImages;
  }

  async getMyItems(page = 0, size = 20) {
    const endpoint = `core/api/items/me?page=${page}&size=${size}`;
    const response = await http.get<PaginatedResponse<ItemResponse> | ItemResponse[]>(endpoint);
    
    const mapItemsWithImages = (items: ItemResponse[]): ItemWithImages[] =>
      items.map((item) => ({
        ...item,
        images: item.itemImageList || [],
        favoriteCount: item.favoriteCount ?? 0,
        isFavorited: item.isFavorited ?? false,
      }));

    if (Array.isArray(response)) {
      const mappedItems = mapItemsWithImages(response);
      return {
        content: mappedItems,
        totalElements: mappedItems.length,
        totalPages: 1,
        currentPage: page,
        pageSize: size,
      } as PaginatedResponse<ItemWithImages>;
    }

    const paginatedResponse = response as PaginatedResponse<ItemResponse>;
    return {
      ...paginatedResponse,
      content: mapItemsWithImages(paginatedResponse.content),
    } as PaginatedResponse<ItemWithImages>;
  }

  async updateItem(itemId: string, data: Partial<ItemRequest>) {
    return http.put<ItemWithImages>(`core/api/items/${itemId}`, data);
  }

  async updateItemStatus(itemId: string, status: string) {
    return http.patch<ItemWithImages>(`core/api/items/${itemId}/status`, { status });
  }

  async deleteItem(itemId: string) {
    return http.delete<void>(`core/api/items/${itemId}`);
  }

  async addFavorite(itemId: string) {
    return http.post<void>(`core/api/items/${itemId}/favorite`, {});
  }

  async removeFavorite(itemId: string) {
    return http.delete<void>(`core/api/items/${itemId}/favorite`);
  }

  async getMyFavorites(page = 0, size = 20) {
    return http.get<PaginatedResponse<ItemWithImages>>(`core/api/items/favorites/me?page=${page}&size=${size}`);
  }

  async searchItems(params: SearchParams) {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.categoryId) query.set("categoryId", params.categoryId);
    if (params.minPrice) query.set("minPrice", params.minPrice.toString());
    if (params.maxPrice) query.set("maxPrice", params.maxPrice.toString());
    if (params.condition) query.set("condition", params.condition);
    if (params.transactionType) query.set("transactionType", params.transactionType);
    if (params.city) query.set("city", params.city);
    if (params.district) query.set("district", params.district);
    if (params.ward) query.set("ward", params.ward);
    if (params.page !== undefined) query.set("page", params.page.toString());
    if (params.size !== undefined) query.set("size", params.size.toString());
    if (params.sort) query.set("sort", params.sort);

    const response = await http.get<PageResponse<ItemResponse>>(`core/api/items/search?${query.toString()}`);
    return {
      ...response,
      content: response.content.map((item) => ({
        ...item,
        images: item.itemImageList || [],
        favoriteCount: item.favoriteCount ?? 0,
        isFavorited: item.isFavorited ?? false,
      })),
    } as PageResponse<ItemWithImages>;
  }

  async getFeaturedItems(limit = 4) {
    const response = await http.get<ItemResponse[]>(`core/api/items/featured?limit=${limit}`);
    return (Array.isArray(response) ? response : []).map((item) => ({
      ...item,
      images: item.itemImageList || [],
      favoriteCount: item.favoriteCount ?? 0,
      isFavorited: item.isFavorited ?? false,
    })) as ItemWithImages[];
  }

  async getItemsByUserId(userId: string) {
    return http.get<ItemWithImages[]>(`core/api/items/user/${userId}`);
  }

  async reportItem(data: ReportRequest, images?: File[]) {
    const formData = new FormData();
    formData.append("report", JSON.stringify(data));

    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append("images", image);
      });
    }

    return http.post<ReportResponse>("core/api/reports", formData);
  }

  async renewItem(itemId: string, paymentMethod?: string) {
    const body = paymentMethod ? { paymentMethod } : {};
    const response = await http.post<ItemResponse>(`core/api/items/${itemId}/renew`, body);
    return {
      ...response,
      images: response.itemImageList || [],
      favoriteCount: response.favoriteCount ?? 0,
      isFavorited: response.isFavorited ?? false,
    } as ItemWithImages;
  }
}


export const itemService = new ItemService();

type ItemsState = {
  items: ItemWithImages[];
  myPosts: ItemWithImages[];
  myFavorites: ItemWithImages[];
  selectedItem: ItemWithImages | null;
  categories: any[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  itemLoading: boolean;
  error: string | null;
  totalFavorites: number;
};

const initialState: ItemsState = {
  items: [],
  myPosts: [],
  myFavorites: [],
  selectedItem: null,
  categories: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  pageSize: 20,
  loading: false,
  itemLoading: false,
  error: null,
  totalFavorites: 0,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const fetchMyItems = createAsyncThunk<
  PaginatedResponse<ItemWithImages>,
  { page?: number; size?: number } | void,
  { rejectValue: string }
>("items/fetchMyItems", async (params, { rejectWithValue }) => {
  try {
    const { page = 0, size = 20 } = params || {};
    return await itemService.getMyItems(page, size);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể tải danh sách tin"));
  }
});

export const fetchMyFavorites = createAsyncThunk<
  PaginatedResponse<ItemWithImages>,
  void,
  { rejectValue: string }
>("items/fetchMyFavorites", async (_, { rejectWithValue }) => {
  try {
    return await itemService.getMyFavorites(0, 50);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể tải yêu thích"));
  }
});

export const fetchCategories = createAsyncThunk<
  any[],
  void,
  { rejectValue: string }
>("items/fetchCategories", async (_, { rejectWithValue }) => {
  try {
    return await http.get<any[]>("/core/api/categories");
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể tải danh mục"));
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
    return rejectWithValue(getErrorMessage(error, "Không thể tải chi tiết tin"));
  }
});

export const createNewItem = createAsyncThunk<
  ItemResponse,
  { payload: ItemRequest; images?: File[] },
  { rejectValue: string }
>("items/createNewItem", async ({ payload, images }, { rejectWithValue }) => {
  try {
    return await itemService.createItem(payload, images);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể đăng tin"));
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
    return rejectWithValue(getErrorMessage(error, "Không thể cập nhật tin"));
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
    return rejectWithValue(getErrorMessage(error, "Không thể cập nhật trạng thái tin"));
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
    return rejectWithValue(getErrorMessage(error, "Không thể xóa tin"));
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
    return rejectWithValue(getErrorMessage(error, "Không thể cập nhật trạng thái yêu thích"));
  }
});

export const reportItemThunk = createAsyncThunk<
  ReportResponse,
  { data: ReportRequest; images?: File[] },
  { rejectValue: string }
>("items/reportItem", async ({ data, images }, { rejectWithValue }) => {
  try {
    return await itemService.reportItem(data, images);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể báo cáo bài viết"));
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
    builder
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchMyFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.myFavorites = action.payload.content || (action.payload as any);
        state.items = state.myFavorites;
        state.totalFavorites = action.payload.totalElements ?? state.myFavorites.length;
      })
      .addCase(fetchMyFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      })
      .addCase(fetchMyItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content || (action.payload as any);
        state.myPosts = state.items;
      })
      .addCase(fetchMyItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể tải danh sách tin";
      })
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
        state.error = action.payload || "Không thể tải chi tiết tin";
      })
      .addCase(createNewItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewItem.fulfilled, (state, action) => {
        state.loading = false;
        state.myPosts = [action.payload as any, ...state.myPosts];
        state.items = state.myPosts;
      })
      .addCase(createNewItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể đăng tin";
      })
      .addCase(updateExistingItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExistingItem.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((i) => i.itemId === action.payload.itemId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateExistingItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể cập nhật tin";
      })
      .addCase(updateItemStatusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateItemStatusThunk.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((i) => i.itemId === action.payload.itemId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedItem?.itemId === action.payload.itemId) {
          state.selectedItem = action.payload;
        }
      })
      .addCase(updateItemStatusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể cập nhật trạng thái tin";
      })
      .addCase(deleteItemThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteItemThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((i) => i.itemId !== action.payload);
        if (state.selectedItem?.itemId === action.payload) {
          state.selectedItem = null;
        }
      })
      .addCase(deleteItemThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể xóa tin";
      })
      .addCase(toggleItemFavorite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleItemFavorite.fulfilled, (state, action) => {
        state.loading = false;
        let targetItem = null;

        // Update in items list
        const item = state.items.find((i) => i.itemId === action.payload.itemId);
        if (item) {
          item.isFavorited = action.payload.isFavorited;
          if (item.favoriteCount !== undefined) {
            item.favoriteCount += action.payload.isFavorited ? 1 : -1;
          }
          targetItem = { ...item };
        }
        
        // Update in selectedItem
        if (state.selectedItem && state.selectedItem.itemId === action.payload.itemId) {
          state.selectedItem.isFavorited = action.payload.isFavorited;
          if (state.selectedItem.favoriteCount !== undefined) {
            state.selectedItem.favoriteCount += action.payload.isFavorited ? 1 : -1;
          }
          if (!targetItem) {
            targetItem = { ...state.selectedItem };
          }
        }

        // Also update myFavorites array
        const favIndex = state.myFavorites.findIndex((i) => i.itemId === action.payload.itemId);
        if (favIndex !== -1) {
          if (!action.payload.isFavorited) {
            // If unfavorited, remove from list
            state.myFavorites.splice(favIndex, 1);
            state.totalFavorites = Math.max(0, state.totalFavorites - 1);
          } else {
            state.myFavorites[favIndex].isFavorited = true;
          }
        } else if (action.payload.isFavorited) {
          if (targetItem) {
            state.myFavorites.unshift(targetItem);
          }
          state.totalFavorites += 1;
        }
      })
      .addCase(toggleItemFavorite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể cập nhật trạng thái yêu thích";
      })
      .addCase(reportItemThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reportItemThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(reportItemThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể báo cáo bài viết";
      });
  },
});

export const { clearSelectedItem, clearError } = itemsSlice.actions;
export default itemsSlice.reducer;
