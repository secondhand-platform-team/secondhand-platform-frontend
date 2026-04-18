import http from "@/utils/api";
import type {
  SearchHistoryRequest,
  SearchHistoryResponse,
  SearchHistoryPageResponse,
} from "@/types/search.type";

class SearchService {
  /**
   * Save search history when user performs a search
   */
  async saveSearchHistory(request: SearchHistoryRequest) {
    return http.post<SearchHistoryResponse>(
      "core/api/search-history",
      request
    );
  }

  /**
   * Get paginated search history
   */
  async getSearchHistory(page: number = 0, size: number = 10) {
    return http.get<SearchHistoryPageResponse>(
      `core/api/search-history?page=${page}&size=${size}`
    );
  }

  /**
   * Get recent searches (typically last 10)
   */
  async getRecentSearches() {
    return http.get<SearchHistoryResponse[]>("core/api/search-history/recent");
  }

  /**
   * Get search suggestions based on common searches
   */
  async getSearchSuggestions() {
    return http.get<string[]>("core/api/search-history/suggestions");
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches() {
    return http.get<string[]>("core/api/search-history/trending");
  }

  /**
   * Get search history by category
   */
  async getSearchHistoryByCategory(
    categoryId: string,
    page: number = 0,
    size: number = 10
  ) {
    return http.get<SearchHistoryPageResponse>(
      `core/api/search-history/category/${categoryId}?page=${page}&size=${size}`
    );
  }

  /**
   * Delete specific search history
   */
  async deleteSearchHistory(id: number) {
    return http.delete(`core/api/search-history/${id}`);
  }

  /**
   * Clear all search history
   */
  async clearSearchHistory() {
    return http.delete("core/api/search-history/clear");
  }
}

export const searchService = new SearchService();
