import http from "@/utils/api";

export interface ItemAttributeRequest {
  code: string;
  value: unknown;
}

export interface LocationRequest {
  address: string;
  ward?: string;
  district?: string;
  city?: string;
}

export interface ItemImageRequest {
  imageUrl: string;
  isPrimary?: boolean;
}

export interface ItemRequest {
  title: string;
  description: string;
  condition: string; // NEW, LIKE_NEW, USED, FOR_PARTS
  categoryId: string;
  transactionType: string; // SELL, GIVEWAY
  price: number | null;
  status?: string; // AVAILABLE, RESERVED, SOLD, HIDDEN
  location: LocationRequest;
  attributes: ItemAttributeRequest[];
}

export interface ItemResponse {
  itemId: string;
  title: string;
  description: string;
  condition: string;
  categoryId: string;
  transactionType: string;
  price: number | null;
  location: LocationRequest;
  attributes: ItemAttributeRequest[];
  createdAt: string;
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
