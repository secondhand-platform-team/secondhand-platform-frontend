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

const itemSlice = createSlice({
  name: "item",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export default itemSlice.reducer;
