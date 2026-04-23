// Types liên quan đến danh mục (category)

export interface CategoryResponse {
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  postingFee: number;
}

export interface CategoryAttributeResponse {
  attributeId: string;
  name: string;
  type: string;
  required: boolean;
  options: string[] | null;
}
