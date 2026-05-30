import http from "@/utils/api";
import { type SearchParams } from "@/stores/slices/items.slice";
import type { ItemWithImages, PaginatedResponse as PageResponse } from "@/types/item.type";
import type { ItemResponse } from "@/types/item.type";
import {
  type DataType,
  type CategoryAttribute,
  type Category,
  type ChildCategory,
  type CategoryResponse,
  type ChildCategoriesResponse,
  type CategoryAttributesResponse,
} from "@/types/category.type";

// Re-export for backward compatibility
export type {
  DataType,
  CategoryAttribute,
  Category,
  ChildCategory,
  CategoryResponse,
  ChildCategoriesResponse,
  CategoryAttributesResponse,
};

class CategoryService {
  async getCategoryById(categoryId: string) {
    return http.get<CategoryResponse>(`core/api/categories/${categoryId}`);
  }

  async getTopLevelCategories() {
    return http.get<Category[]>(`core/api/categories/top-level`);
  }

  async getChildCategories(categoryId: string) {
    return http.get<ChildCategory[]>(
      `core/api/categories/${categoryId}/children`
    );
  }

  async searchItemsByCategory(categoryId: string, params: SearchParams) {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
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

    const response = await http.get<PageResponse<ItemResponse>>(`core/api/categories/${categoryId}/items?${query.toString()}`);
    return {
      ...response,
      content: response.content.map((item) => ({
        ...item,
        images: item.itemImageList || [],
        favoriteCount: item.favoriteCount ?? 0,
        isFavorited: item.isFavorited ?? false,
        viewCount: (item as any).viewCount ?? 0,
      })) as ItemWithImages[],
    } as PageResponse<ItemWithImages>;
  }

  async getCategoryAttributes(categoryId: string) {
    return http.get<CategoryAttributesResponse>(
      `core/api/categories/${categoryId}/attributes`
    );
  }

  async getAllCategories() {
    return http.get<CategoryResponse[]>(`core/api/categories`);
  }
}

export const categoryService = new CategoryService();