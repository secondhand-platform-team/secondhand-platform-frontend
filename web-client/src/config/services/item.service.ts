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
    return http.get<ItemResponse>(`core/api/items/${itemId}`);
  }

  async getMyItems() {
    return http.get<ItemResponse[]>("core/api/items/me");
  }

  async getAllItems() {
    return http.get<ItemResponse[]>("core/api/items");
  }

  async getItemsByCategory(categoryId: string) {
    return http.get<ItemResponse[]>(`core/api/items/category/${categoryId}`);
  }

  async updateItem(itemId: string, data: Partial<ItemRequest>) {
    return http.put<ItemResponse>(`core/api/items/${itemId}`, data);
  }

  async updateItemStatus(itemId: string, status: string) {
    return http.patch<ItemResponse>(`core/api/items/${itemId}/status`, { status });
  }

  async deleteItem(itemId: string) {
    return http.delete<void>(`core/api/items/${itemId}`);
  }

  async addFavorite(itemId: string) {
    return http.post<{ message: string }>(`core/api/items/${itemId}/favorite`, {});
  }

  async removeFavorite(itemId: string) {
    return http.delete<{ message: string }>(`core/api/items/${itemId}/favorite`);
  }

  async getMyFavorites() {
    return http.get<ItemResponse[]>("core/api/items/favorites/me");
  }
}

export const itemService = new ItemService();
