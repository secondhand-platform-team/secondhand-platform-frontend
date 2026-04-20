import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import http from "../../utils/api";
import type { CategoryResponse } from "../../types/category.type";

interface CategoryState {
  categories: CategoryResponse[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
  error: null,
};

export const fetchAllCategories = createAsyncThunk<
  CategoryResponse[],
  void,
  { rejectValue: string }
>("category/fetchAllCategories", async (_, { rejectWithValue }) => {
  try {
    const response = await http.get("/categories", {
      headers: { "X-Service": "core" },
    });
    return response as CategoryResponse[];
  } catch (error: any) {
    return rejectWithValue(error.message || "Không thể lấy danh mục");
  }
});

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchAllCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      });
  },
});

export default categorySlice.reducer;
