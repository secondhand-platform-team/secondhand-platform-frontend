import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "@/utils/api";
import type {
  SearchHistoryRequest,
  SearchHistoryResponse,
  SearchHistoryPageResponse,
} from "@/types/search.type";

class SearchService {
  async saveSearchHistory(request: SearchHistoryRequest) {
    return http.post<SearchHistoryResponse>("core/api/search-history", request as unknown as Record<string, unknown>);
  }
  async getSearchHistory(page: number = 0, size: number = 10) {
    return http.get<SearchHistoryPageResponse>(`core/api/search-history?page=${page}&size=${size}`);
  }
  async getRecentSearches() {
    return http.get<SearchHistoryResponse[]>("core/api/search-history/recent");
  }
  async getSearchSuggestions() {
    return http.get<string[]>("core/api/search-history/suggestions");
  }
  async getTrendingSearches() {
    return http.get<string[]>("core/api/search-history/trending");
  }
  async getSearchHistoryByCategory(categoryId: string, page: number = 0, size: number = 10) {
    return http.get<SearchHistoryPageResponse>(`core/api/search-history/category/${categoryId}?page=${page}&size=${size}`);
  }
  async deleteSearchHistory(id: number | string) {
    return http.delete(`core/api/search-history/${id}`);
  }
  async clearSearchHistory() {
    return http.delete("core/api/search-history/clear");
  }
}

export const searchService = new SearchService();

type SearchState = {
  recentSearches: SearchHistoryResponse[];
  suggestions: string[];
  trending: string[];
  loading: boolean;
  error: string | null;
};

const initialState: SearchState = {
  recentSearches: [],
  suggestions: [],
  trending: [],
  loading: false,
  error: null,
};

export const fetchRecentSearches = createAsyncThunk<SearchHistoryResponse[], void, { rejectValue: string }>(
  "search/fetchRecentSearches",
  async (_, { rejectWithValue }) => {
    try {
      return await searchService.getRecentSearches();
    } catch (error) {
      return rejectWithValue("Không thể tải lịch sử tìm kiếm");
    }
  }
);

export const fetchSuggestions = createAsyncThunk<string[], void, { rejectValue: string }>(
  "search/fetchSuggestions",
  async (_, { rejectWithValue }) => {
    try {
      return await searchService.getSearchSuggestions();
    } catch (error) {
      return rejectWithValue("Không thể tải gợi ý");
    }
  }
);

export const fetchTrending = createAsyncThunk<string[], void, { rejectValue: string }>(
  "search/fetchTrending",
  async (_, { rejectWithValue }) => {
    try {
      return await searchService.getTrendingSearches();
    } catch (error) {
      return rejectWithValue("Không thể tải xu hướng");
    }
  }
);

export const deleteRecentSearch = createAsyncThunk<string | number, string | number, { rejectValue: string }>(
  "search/deleteRecentSearch",
  async (id, { rejectWithValue }) => {
    try {
      await searchService.deleteSearchHistory(id);
      return id;
    } catch (error) {
      return rejectWithValue("Không thể xóa lịch sử");
    }
  }
);

export const clearAllRecentSearches = createAsyncThunk<void, void, { rejectValue: string }>(
  "search/clearAllRecentSearches",
  async (_, { rejectWithValue }) => {
    try {
      await searchService.clearSearchHistory();
    } catch (error) {
      return rejectWithValue("Không thể xóa tất cả lịch sử");
    }
  }
);

export const saveSearchTerm = createAsyncThunk<SearchHistoryResponse, SearchHistoryRequest, { rejectValue: string }>(
  "search/saveSearchTerm",
  async (request, { rejectWithValue }) => {
    try {
      return await searchService.saveSearchHistory(request);
    } catch (error) {
      return rejectWithValue("Không thể lưu tìm kiếm");
    }
  }
);

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentSearches.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecentSearches.fulfilled, (state, action) => {
        state.loading = false;
        state.recentSearches = action.payload;
      })
      .addCase(fetchRecentSearches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestions = action.payload;
      })
      .addCase(fetchTrending.fulfilled, (state, action) => {
        state.trending = action.payload;
      })
      .addCase(deleteRecentSearch.fulfilled, (state, action) => {
        state.recentSearches = state.recentSearches.filter(s => s.id !== action.payload);
      })
      .addCase(clearAllRecentSearches.fulfilled, (state) => {
        state.recentSearches = [];
      })
      .addCase(saveSearchTerm.fulfilled, (state, action) => {
        const newSearch = action.payload;
        // avoid duplicates
        state.recentSearches = [newSearch, ...state.recentSearches.filter(s => s.searchQuery !== newSearch.searchQuery)];
      });
  },
});

export default searchSlice.reducer;
