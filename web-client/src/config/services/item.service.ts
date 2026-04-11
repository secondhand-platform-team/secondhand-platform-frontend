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

  async updateItem(itemId: string, data: Partial<ItemRequest>) {
    return http.put<ItemResponse>(`core/api/items/${itemId}`, data);
  }

  async deleteItem(itemId: string) {
    return http.delete<void>(`core/api/items/${itemId}`);
  }
}

export const itemService = new ItemService();
