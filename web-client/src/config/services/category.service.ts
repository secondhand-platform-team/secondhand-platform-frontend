import http from "@/utils/api";
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
    return http.get<ChildCategoriesResponse>(
      `core/api/categories/${categoryId}/parents`
    );
  }

  async getCategoryAttributes(categoryId: string) {
    return http.get<CategoryAttributesResponse>(
      `core/api/categories/${categoryId}/attributes`
    );
  }
}

export const categoryService = new CategoryService();
