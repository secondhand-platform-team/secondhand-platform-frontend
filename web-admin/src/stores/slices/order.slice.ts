import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import http from "../../utils/api";
import type { Order, OrderEvent, AdminStats } from "../../types/order.type";

interface OrderState {
  orders: Order[];
  disputedOrders: Order[];
  events: OrderEvent[];
  stats: AdminStats | null;
  loading: boolean;
  eventsLoading: boolean;
  statsLoading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  disputedOrders: [],
  events: [],
  stats: null,
  loading: false,
  eventsLoading: false,
  statsLoading: false,
  error: null,
};

const fixUtf8Encoding = (str: string): string => {
  if (!str) return str;
  try {
    if (/[\u0080-\u00FF]/.test(str)) {
      return decodeURIComponent(escape(str));
    }
  } catch (e) {
    // Ignore and fallback
  }
  return str;
};

const fixObjectEncoding = (obj: any): any => {
  if (!obj) return obj;
  if (typeof obj === "string") {
    return fixUtf8Encoding(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(fixObjectEncoding);
  }
  if (typeof obj === "object") {
    const fixed: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      fixed[k] = fixObjectEncoding(v);
    }
    return fixed;
  }
  return obj;
};

const SVC = { headers: { "X-Service": "order" } };

// Fetch all orders
export const fetchAllOrders = createAsyncThunk<Order[], void, { rejectValue: string }>(
  "order/fetchAllOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await http.get("/orders/admin/all", SVC);
      return response as Order[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi tải đơn hàng");
    }
  }
);

// Fetch disputed orders
export const fetchDisputedOrders = createAsyncThunk<Order[], void, { rejectValue: string }>(
  "order/fetchDisputedOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await http.get("/orders/admin/disputes", SVC);
      return response as Order[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi tải đơn tranh chấp");
    }
  }
);

// Fetch order stats
export const fetchOrderStats = createAsyncThunk<AdminStats, void, { rejectValue: string }>(
  "order/fetchOrderStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await http.get("/orders/admin/statistics?timeframe=today", SVC);
      return response as AdminStats;
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi tải thống kê đơn hàng");
    }
  }
);

// Fetch order events
export const fetchOrderEvents = createAsyncThunk<OrderEvent[], string, { rejectValue: string }>(
  "order/fetchOrderEvents",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await http.get(`/orders/${orderId}/events`, SVC);
      return Array.isArray(response) 
        ? response.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())
        : [];
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi tải lịch sử sự kiện");
    }
  }
);

// Update order status
export const updateOrderStatus = createAsyncThunk<Order, { orderId: string; status: string }, { rejectValue: string }>(
  "order/updateOrderStatus",
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const response = await http.put(`/orders/admin/${orderId}/status`, { status }, SVC);
      return response as Order;
    } catch (error: any) {
      return rejectWithValue(error.message || "Cập nhật trạng thái thất bại");
    }
  }
);

// Resolve dispute
export const resolveOrderDispute = createAsyncThunk<Order, { orderId: string; action: "refund" | "release" }, { rejectValue: string }>(
  "order/resolveOrderDispute",
  async ({ orderId, action }, { rejectWithValue }) => {
    try {
      const response = await http.put(`/orders/admin/${orderId}/resolve-dispute`, { action }, SVC);
      return response as Order;
    } catch (error: any) {
      return rejectWithValue(error.message || "Xử lý tranh chấp thất bại");
    }
  }
);

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearOrderEvents(state) {
      state.events = [];
    }
  },
  extraReducers: (builder) => {
    // fetchAllOrders
    builder
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = fixObjectEncoding(action.payload);
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      });

    // fetchDisputedOrders
    builder
      .addCase(fetchDisputedOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDisputedOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.disputedOrders = fixObjectEncoding(action.payload);
      })
      .addCase(fetchDisputedOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      });

    // fetchOrderStats
    builder
      .addCase(fetchOrderStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchOrderStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = fixObjectEncoding(action.payload);
      })
      .addCase(fetchOrderStats.rejected, (state) => {
        state.statsLoading = false;
      });

    // fetchOrderEvents
    builder
      .addCase(fetchOrderEvents.pending, (state) => {
        state.eventsLoading = true;
      })
      .addCase(fetchOrderEvents.fulfilled, (state, action) => {
        state.eventsLoading = false;
        state.events = fixObjectEncoding(action.payload);
      })
      .addCase(fetchOrderEvents.rejected, (state, action) => {
        state.eventsLoading = false;
        state.error = action.payload || "Lỗi";
      });

    // updateOrderStatus
    builder
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const fixed = fixObjectEncoding(action.payload);
        const idx = state.orders.findIndex(o => o.id === fixed.id);
        if (idx !== -1) {
          state.orders[idx] = fixed;
        }
      });

    // resolveOrderDispute
    builder
      .addCase(resolveOrderDispute.fulfilled, (state, action) => {
        const fixed = fixObjectEncoding(action.payload);
        const idx = state.orders.findIndex(o => o.id === fixed.id);
        if (idx !== -1) {
          state.orders[idx] = fixed;
        }
        state.disputedOrders = state.disputedOrders.filter(o => o.id !== fixed.id);
      });
  },
});

export const { clearOrderEvents } = orderSlice.actions;
export default orderSlice.reducer;
