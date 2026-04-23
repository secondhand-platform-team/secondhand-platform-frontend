"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "@/utils/api";
import type {
  CategoryType,
  ItemRequestPayload,
  ItemResponseType,
  ItemStatus,
  MessageResponseType,
} from "@/types/item/item.type";

type ItemState = {
  loading: boolean;
  submitting: boolean;
  error: string | null;
  categories: CategoryType[];
  myPosts: ItemResponseType[];
  myFavorites: ItemResponseType[];
};

const initialState: ItemState = {
  loading: false,
  submitting: false,
  error: null,
  categories: [],
  myPosts: [],
  myFavorites: [],
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export const fetchCategories = createAsyncThunk<
  CategoryType[],
  void,
  { rejectValue: string }
>("item/fetchCategories", async (_, { rejectWithValue }) => {
  try {
    return await http.get<CategoryType[]>("/core/api/categories");
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể tải danh mục"));
  }
});

export const createPost = createAsyncThunk<
  ItemResponseType,
  ItemRequestPayload,
  { rejectValue: string }
>("item/createPost", async (payload, { rejectWithValue }) => {
  try {
    return await http.post<ItemResponseType>("/core/api/items/json", payload);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể đăng tin"));
  }
});

export const createPostWithImages = createAsyncThunk<
  ItemResponseType,
  { payload: ItemRequestPayload; images: File[] },
  { rejectValue: string }
>("item/createPostWithImages", async ({ payload, images }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append("item", JSON.stringify(payload));

    images.forEach((file) => {
      formData.append("images", file);
    });

    return await http.post<ItemResponseType>("/core/api/items", formData);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể đăng tin kèm ảnh"));
  }
});

export const fetchMyPosts = createAsyncThunk<
  ItemResponseType[],
  void,
  { rejectValue: string }
>("item/fetchMyPosts", async (_, { rejectWithValue }) => {
  try {
    return await http.get<ItemResponseType[]>("/core/api/items/me");
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể tải tin đăng của bạn"));
  }
});

export const updatePostStatus = createAsyncThunk<
  ItemResponseType,
  { itemId: string; status: ItemStatus },
  { rejectValue: string }
>("item/updatePostStatus", async ({ itemId, status }, { rejectWithValue }) => {
  try {
    return await http.patch<ItemResponseType>(`/core/api/items/${itemId}/status`, { status });
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể cập nhật trạng thái tin"));
  }
});

export const deletePost = createAsyncThunk<
  { itemId: string; message: string },
  string,
  { rejectValue: string }
>("item/deletePost", async (itemId, { rejectWithValue }) => {
  try {
    const response = await http.delete<MessageResponseType>(`/core/api/items/${itemId}`);
    return { itemId, message: response.message };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể xóa tin"));
  }
});

export const fetchMyFavorites = createAsyncThunk<
  ItemResponseType[],
  void,
  { rejectValue: string }
>("item/fetchMyFavorites", async (_, { rejectWithValue }) => {
  try {
    return await http.get<ItemResponseType[]>("/core/api/items/favorites/me");
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể tải danh sách yêu thích"));
  }
});

export const addFavorite = createAsyncThunk<
  { itemId: string },
  string,
  { rejectValue: string }
>("item/addFavorite", async (itemId, { rejectWithValue }) => {
  try {
    await http.post<MessageResponseType>(`/core/api/items/${itemId}/favorite`);
    return { itemId };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể thêm yêu thích"));
  }
});

export const removeFavorite = createAsyncThunk<
  { itemId: string },
  string,
  { rejectValue: string }
>("item/removeFavorite", async (itemId, { rejectWithValue }) => {
  try {
    await http.delete<MessageResponseType>(`/core/api/items/${itemId}/favorite`);
    return { itemId };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể xóa yêu thích"));
  }
});

const itemSlice = createSlice({
  name: "item",
  initialState,
  reducers: {
    clearItemError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể tải danh mục";
      })

      .addCase(createPost.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.submitting = false;
        state.myPosts = [action.payload, ...state.myPosts];
      })
      .addCase(createPost.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || "Không thể đăng tin";
      })

      .addCase(createPostWithImages.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createPostWithImages.fulfilled, (state, action) => {
        state.submitting = false;
        state.myPosts = [action.payload, ...state.myPosts];
      })
      .addCase(createPostWithImages.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || "Không thể đăng tin kèm ảnh";
      })

      .addCase(fetchMyPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.myPosts = action.payload;
      })
      .addCase(fetchMyPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể tải tin đăng";
      })

      .addCase(updatePostStatus.fulfilled, (state, action) => {
        state.myPosts = state.myPosts.map((item) =>
          item.itemId === action.payload.itemId ? action.payload : item
        );
      })
      .addCase(updatePostStatus.rejected, (state, action) => {
        state.error = action.payload || "Không thể cập nhật trạng thái";
      })

      .addCase(deletePost.fulfilled, (state, action) => {
        state.myPosts = state.myPosts.filter((item) => item.itemId !== action.payload.itemId);
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.error = action.payload || "Không thể xóa tin";
      })

      .addCase(fetchMyFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.myFavorites = action.payload;
      })
      .addCase(fetchMyFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể tải yêu thích";
      })

      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.myFavorites = state.myFavorites.filter((item) => item.itemId !== action.payload.itemId);
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.error = action.payload || "Không thể xóa yêu thích";
      })

      .addCase(addFavorite.rejected, (state, action) => {
        state.error = action.payload || "Không thể thêm yêu thích";
      });
  },
});

export const { clearItemError } = itemSlice.actions;
export default itemSlice.reducer;
