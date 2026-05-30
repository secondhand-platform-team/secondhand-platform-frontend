import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "../../utils/api";

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "DEPOSIT" | "WITHDRAW" | "PAYMENT" | "REFUND" | "ESCROW_HOLD" | "ESCROW_RELEASE" | "ESCROW_REFUND";
  status: "PENDING" | "SUCCESS" | "FAILED";
  referenceId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface WalletTransactionListResponse {
  content: WalletTransaction[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

interface WalletState {
  transactions: WalletTransaction[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  listLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  transactions: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  listLoading: false,
  error: null,
};

export const fetchWalletTransactions = createAsyncThunk<
  WalletTransactionListResponse,
  {
    page: number;
    size: number;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  },
  { rejectValue: string }
>(
  "wallet/fetchTransactions",
  async ({ page, size, type, status, startDate, endDate }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
      });

      if (type) params.set("type", type);
      if (status) params.set("status", status);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await http.get(
        `/wallet/admin/transactions?${params.toString()}`,
        {
          headers: { "X-Service": "core" },
        }
      );
      return response as WalletTransactionListResponse;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Không thể lấy danh sách giao dịch ví"
      );
    }
  }
);

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalletTransactions.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchWalletTransactions.fulfilled, (state, action) => {
        state.listLoading = false;
        state.transactions = action.payload.content;
        state.totalElements = action.payload.totalElements;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchWalletTransactions.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload || "Lỗi";
      });
  },
});

export default walletSlice.reducer;
