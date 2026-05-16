import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "../../utils/api";
import type { PaymentListResponse, PaymentResponse } from "../../types/payment.type";

interface PaymentState {
  payments: PaymentResponse[];
  selectedPayment: PaymentResponse | null;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  listLoading: boolean;
  detailLoading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  payments: [],
  selectedPayment: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  listLoading: false,
  detailLoading: false,
  error: null,
};

export const fetchPayments = createAsyncThunk<
  PaymentListResponse,
  {
    page: number;
    size: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  },
  { rejectValue: string }
>("payment/fetchPayments", async ({ page, size, status, startDate, endDate }, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    if (status) params.set("status", status);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const response = await http.get(`/admin/payments?${params.toString()}`, {
      headers: { "X-Service": "order" },
    });
    return response as PaymentListResponse;
  } catch (error: unknown) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Không thể lấy danh sách thanh toán",
    );
  }
});

export const fetchPaymentDetail = createAsyncThunk<
  PaymentResponse,
  string,
  { rejectValue: string }
>("payment/fetchPaymentDetail", async (paymentId, { rejectWithValue }) => {
  try {
    const response = await http.get(`/admin/payments/${paymentId}`, {
      headers: { "X-Service": "order" },
    });
    return response as PaymentResponse;
  } catch (error: unknown) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Không thể lấy chi tiết thanh toán",
    );
  }
});

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    clearSelectedPayment: (state) => {
      state.selectedPayment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.listLoading = false;
        state.payments = action.payload.content;
        state.totalElements = action.payload.totalElements;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload || "Lỗi";
      })
      .addCase(fetchPaymentDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedPayment = action.payload;
      })
      .addCase(fetchPaymentDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload || "Lỗi";
      });
  },
});

export const { clearSelectedPayment } = paymentSlice.actions;
export default paymentSlice.reducer;