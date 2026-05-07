import http from "@/utils/api";
import {
  type ItemAttributeRequest,
  type LocationRequest,
  type ItemImageRequest,
  type ItemRequest,
  type ItemResponse,
} from "@/types/item.type";

// Re-export for backward compatibility
export type {
  ItemAttributeRequest,
  LocationRequest,
  ItemImageRequest,
  ItemRequest,
  ItemResponse,
};

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ItemWithImages extends ItemResponse {
  images?: Array<{
    imageId: string;
    imageUrl: string;
    isPrimary: boolean;
  }>;
  favoriteCount?: number;
  viewCount?: number;
}

export interface SearchParams {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  transactionType?: string;
  city?: string;
  district?: string;
  ward?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

class ItemService {
  async createItem(data: ItemRequest, images?: File[]) {
    // If there are images, use multipart/form-data
    if (images && images.length > 0) {
      const formData = new FormData();
      formData.append("item", new Blob([JSON.stringify(data)], { type: "application/json" }));
      
      images.forEach((image) => {
        formData.append("images", image);
      });

      return http.post<ItemResponse>("core/api/items", formData);
    }

    // Otherwise, use JSON endpoint
    return http.post<ItemResponse>("core/api/items/json", data as unknown as Record<string, unknown>);
  }

  async getItem(itemId: string) {
    const response = await http.get<ItemResponse>(`core/api/items/${itemId}`);
    return {
      ...response,
      images: response.itemImageList || [],
      favoriteCount: response.favoriteCount ?? 0,
      isFavorited: response.isFavorited ?? false,
      viewCount: 0,
    } as ItemWithImages;
  }

  async getMyItems(page = 0, size = 20) {
    const endpoint = `core/api/items/me?page=${page}&size=${size}`;
    try {
      const response = await http.get<PaginatedResponse<ItemResponse> | ItemResponse[]>(endpoint);
      
      // Map itemImageList to images & ensure all fields are present
      const mapItemsWithImages = (items: ItemResponse[]): ItemWithImages[] =>
        items.map((item) => ({
          ...item,
          images: item.itemImageList || [],
          favoriteCount: item.favoriteCount ?? 0,
          isFavorited: item.isFavorited ?? false,
          viewCount: 0,
        }));

      // Handle both formats: PaginatedResponse or array directly
      if (Array.isArray(response)) {
        const mappedItems = mapItemsWithImages(response);
        return {
          content: mappedItems,
          totalElements: mappedItems.length,
          totalPages: 1,
          currentPage: page,
          pageSize: size,
        } as PaginatedResponse<ItemWithImages>;
      }

      // Map the content array
      const paginatedResponse = response as PaginatedResponse<ItemResponse>;
      return {
        ...paginatedResponse,
        content: mapItemsWithImages(paginatedResponse.content),
      } as PaginatedResponse<ItemWithImages>;
    } catch (err) {
      console.error("🚨 API Error:", err);
      throw err;
    }
  }

  async updateItem(itemId: string, data: Partial<ItemRequest>) {
    return http.put<ItemWithImages>(`core/api/items/${itemId}`, data);
  }

  async updateItemStatus(itemId: string, status: string) {
    return http.patch<ItemWithImages>(`core/api/items/${itemId}/status`, { status });
  }

  async deleteItem(itemId: string) {
    return http.delete<void>(`core/api/items/${itemId}`);
  }

  async addFavorite(itemId: string) {
    return http.post<void>(`core/api/items/${itemId}/favorite`, {});
  }

  async removeFavorite(itemId: string) {
    return http.delete<void>(`core/api/items/${itemId}/favorite`);
  }

  async getMyFavorites(page = 0, size = 20) {
    return http.get<PaginatedResponse<ItemWithImages>>(
      `core/api/items/favorites/me?page=${page}&size=${size}`
    );
  }

  async searchItems(params: SearchParams) {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.categoryId) query.set("categoryId", params.categoryId);
    if (params.minPrice !== undefined) query.set("minPrice", String(params.minPrice));
    if (params.maxPrice !== undefined) query.set("maxPrice", String(params.maxPrice));
    if (params.condition) query.set("condition", params.condition);
    if (params.transactionType) query.set("transactionType", params.transactionType);
    if (params.city) query.set("city", params.city);
    if (params.district) query.set("district", params.district);
    if (params.ward) query.set("ward", params.ward);
    query.set("page", String(params.page ?? 0));
    query.set("size", String(params.size ?? 12));
    if (params.sort) query.set("sort", params.sort);

    const response = await http.get<PageResponse<ItemResponse>>(`core/api/items/search?${query.toString()}`);
    return {
      ...response,
      content: response.content.map((item) => ({
        ...item,
        images: item.itemImageList || [],
        favoriteCount: item.favoriteCount ?? 0,
        isFavorited: item.isFavorited ?? false,
        viewCount: 0,
      })) as ItemWithImages[],
    } as PageResponse<ItemWithImages>;
  }

  async getFeaturedItems(limit = 4) {
    const response = await http.get<ItemResponse[]>(`core/api/items/featured?limit=${limit}`);
    return (Array.isArray(response) ? response : []).map((item) => ({
      ...item,
      images: item.itemImageList || [],
      favoriteCount: item.favoriteCount ?? 0,
      isFavorited: item.isFavorited ?? false,
      viewCount: 0,
    })) as ItemWithImages[];
  }
}

export const itemService = new ItemService();