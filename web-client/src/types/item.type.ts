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

export interface ItemImageResponse {
  imageId: string;
  imageUrl: string;
  isPrimary: boolean;
}

export interface ItemResponse {
  itemId: string;
  title: string;
  description: string;
  condition: string;
  categoryId: string;
  transactionType: string;
  price: number | null;
  status?: string;
  userId?: string;
  location: LocationRequest;
  attributes: ItemAttributeRequest[];
  itemImageList?: ItemImageResponse[];
  createdAt: string;
  updatedAt?: string;
  // Payment fields
  transactionId?: string;
  paymentUrl?: string;
  isFavorited?: boolean;
  favoriteCount?: number;
}
