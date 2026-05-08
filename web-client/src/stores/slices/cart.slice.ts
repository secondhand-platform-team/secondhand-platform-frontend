import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import http from "@/utils/api";

export interface CartItemType {
  itemId: string;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartType {
  userId: string;
  cartItems: CartItemType[];
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartRequest {
  itemId: string;
  quantity: number;
  price: number;
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
      // Backend expects itemId, price, quantity. We'll pass price 0 if not provided, 
      // but ideally we should fetch price first or backend should handle it.
      // Looking at backend CartItemRequest, it has price.
      const data = await http.post<CartType>("/order/api/carts/me/items", request as unknown as Record<string, unknown>);
      return data;
    } catch (error) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Không thể thêm vào giỏ hàng");
    }
  }
);

export const updateItemQuantity = createAsyncThunk(
  "cart/updateItemQuantity",
  async ({ itemId, quantity }: { itemId: string; quantity: number }, { rejectWithValue }) => {
    try {
      // Backend: @PutMapping("/me/items/{itemId}") with @RequestParam Integer quantity
      const data = await http.put<CartType>(`/order/api/carts/me/items/${itemId}?quantity=${quantity}`, {});
      return data;
    } catch (error) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Không thể cập nhật giỏ hàng");
    }
  }
);

export const removeItemFromCart = createAsyncThunk(
  "cart/removeItemFromCart",
  async (itemId: string, { rejectWithValue }) => {
    try {
      // Backend: @DeleteMapping("/me/items/{itemId}")
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
      // Update
      .addCase(updateItemQuantity.fulfilled, (state, action) => {
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
