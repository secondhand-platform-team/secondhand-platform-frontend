// Types liên quan đến tin đăng (item)

export interface ItemImage {
  imageId: string;
  imageUrl: string;
  displayOrder: number;
}

export interface ItemAttribute {
  attributeId: string;
  attributeName: string;
  attributeValue: string;
}

export interface LocationResponse {
  province: string;
  district: string;
  ward: string;
  address: string;
}

export interface ItemResponse {
  itemId: string;
  title: string;
  description: string;
  categoryId: string;
  price: number | null;
  condition: string;
  transactionType: string;
  status: string;
  location: LocationResponse | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  itemImageList: ItemImage[];
  attributes: ItemAttribute[];
  transactionId: string | null;
  paymentUrl: string | null;
}

export interface ItemStatusUpdateRequest {
  status: string;
}
