import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import http from "@/utils/api";

export interface CartItemType {
  id: string;
  itemId: string;
  createdAt: string;
}

export interface CartType {
  userId: string;
  cartItems: CartItemType[];
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartRequest {
  itemId: string;
}

interface CartState {
  cart: CartType | null;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
};

export const fetchMyCart = createAsyncThunk(
  "cart/fetchMyCart",
  async (_, { rejectWithValue }) => {
    try {
      const data = await http.get<CartType>("/order/api/carts/me");
      return data;
    } catch (error) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Không thể lấy giỏ hàng");
    }
  }
);

export const addItemToCart = createAsyncThunk(
  "cart/addItemToCart",
  async (request: AddToCartRequest, { rejectWithValue }) => {
    try {
      const data = await http.post<CartType>("/order/api/carts/me/items", request as unknown as Record<string, unknown>);
      return data;
    } catch (error) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Không thể thêm vào giỏ hàng");
    }
  }
);

export const removeItemFromCart = createAsyncThunk(
  "cart/removeItemFromCart",
  async (itemId: string, { rejectWithValue }) => {
    try {
      const data = await http.delete<CartType>(`/order/api/carts/me/items/${itemId}`);
      return data;
    } catch (error) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Không thể xóa khỏi giỏ hàng");
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCart: (state) => {
      state.cart = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchMyCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(fetchMyCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add
      .addCase(addItemToCart.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      // Remove
      .addCase(removeItemFromCart.fulfilled, (state, action) => {
        state.cart = action.payload;
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
