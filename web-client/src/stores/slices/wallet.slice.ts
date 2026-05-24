import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "@/utils/api";
import type {
  DepositRequest,
  DepositResponse,
  PageResponse,
  WalletResponse,
  WalletTransactionResponse,
} from "@/types/wallet.type";

interface WalletState {
  wallet: WalletResponse | null;
  transactions: WalletTransactionResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: WalletState = {
  wallet: null,
  transactions: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  submitting: false,
  error: null,
};

export const fetchMyWallet = createAsyncThunk<
  WalletResponse,
  void,
  { rejectValue: string }
>("wallet/fetchMyWallet", async (_, { rejectWithValue }) => {
  try {
    return await http.get<WalletResponse>("/core/api/wallet/me");
  } catch (error: unknown) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Không thể tải ví",
    );
  }
});

export const fetchWalletTransactions = createAsyncThunk<
  PageResponse<WalletTransactionResponse>,
  { page: number; size: number },
  { rejectValue: string }
>("wallet/fetchTransactions", async ({ page, size }, { rejectWithValue }) => {
  try {
    return await http.get<PageResponse<WalletTransactionResponse>>(
      `/core/api/wallet/transactions/paged?page=${page}&size=${size}`,
    );
  } catch (error: unknown) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Không thể tải giao dịch ví",
    );
  }
});

export const depositWallet = createAsyncThunk<
  DepositResponse,
  DepositRequest,
  { rejectValue: string }
>("wallet/deposit", async (payload, { rejectWithValue }) => {
  try {
    return await http.post<DepositResponse>("/core/api/wallet/deposit", payload);
  } catch (error: unknown) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Không thể tạo yêu cầu nạp tiền",
    );
  }
});

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload;
      })
      .addCase(fetchMyWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      })
      .addCase(fetchWalletTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWalletTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.content;
        state.totalElements = action.payload.totalElements;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.number;
      })
      .addCase(fetchWalletTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      })
      .addCase(depositWallet.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(depositWallet.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(depositWallet.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || "Lỗi";
      });
  },
});

export const { clearWalletError } = walletSlice.actions;

export const walletService = {
  getWallet: async () => {
    return http.get<WalletResponse>("/core/api/wallet/me");
  },
};

export default walletSlice.reducer;