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
  postingFee?: number; // Phí đăng tin, 0 nếu free
}

export interface ChildCategory {
  categoryId: string;
  name: string;
  icon?: string;
  postingFee?: number; // Phí đăng tin, 0 nếu free
}

export interface CategoryResponse {
  data: Category;
}

export type ChildCategoriesResponse = ChildCategory[];

export type CategoryAttributesResponse = CategoryAttribute[];
