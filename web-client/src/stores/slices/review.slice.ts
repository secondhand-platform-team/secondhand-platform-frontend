import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "@/utils/api";
import type { ReviewRequest, ReviewResponse, ReviewListResponse } from "@/types/review.type";

interface ReviewState {
  reviews: ReviewResponse[];
  averageRating: number;
  totalReviews: number;
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: ReviewState = {
  reviews: [],
  averageRating: 0,
  totalReviews: 0,
  loading: false,
  submitting: false,
  error: null,
};

export const createReview = createAsyncThunk<
  ReviewResponse,
  { itemId: string; data: ReviewRequest },
  { rejectValue: string }
>("review/createReview", async ({ itemId, data }, { rejectWithValue }) => {
  try {
    return await http.post<ReviewResponse>(
      `/core/api/items/${itemId}/reviews`,
      data as unknown as Record<string, unknown>
    );
  } catch (error: unknown) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Không thể gửi đánh giá"
    );
  }
});

export const fetchReviewsBySellerId = createAsyncThunk<
  ReviewListResponse,
  string,
  { rejectValue: string }
>("review/fetchBySellerId", async (userId, { rejectWithValue }) => {
  try {
    return await http.get<ReviewListResponse>(
      `/core/api/users/${userId}/reviews`
    );
  } catch (error: unknown) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Không thể tải danh sách đánh giá"
    );
  }
});

const reviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    },
    resetReviews: (state) => {
      state.reviews = [];
      state.averageRating = 0;
      state.totalReviews = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Review
      .addCase(createReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.submitting = false;
        state.reviews.unshift(action.payload);
        state.totalReviews += 1;
      })
      .addCase(createReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || "Lỗi";
      })
      // Fetch Reviews By Seller
      .addCase(fetchReviewsBySellerId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviewsBySellerId.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.reviews;
        state.averageRating = action.payload.averageRating;
        state.totalReviews = action.payload.totalReviews;
      })
      .addCase(fetchReviewsBySellerId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      });
  },
});

export const { clearReviewError, resetReviews } = reviewSlice.actions;
export default reviewSlice.reducer;
