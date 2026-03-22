import http from "@/utils/api";

export type DataType = "TEXT" | "NUMBER" | "SELECT" | "TEXTAREA" | "DATE";

export interface CategoryAttribute {
  attributeId: string;
  code: string;
  name: string;
  dataType: DataType;
  required: boolean;
  minValueNumber?: number;
  maxValueNumber?: number;
  optionsJson?: string;
  unit?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface ChildCategory {
  categoryId: string;
  name: string;
  icon?: string;
}

export interface CategoryResponse {
  data: Category;
}

export type ChildCategoriesResponse = ChildCategory[];

export type CategoryAttributesResponse = CategoryAttribute[];

class CategoryService {
  async getCategoryById(categoryId: string) {
    return http.get<CategoryResponse>(`core/api/categories/${categoryId}`);
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
