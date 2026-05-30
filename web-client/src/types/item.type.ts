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

export type PaymentMethod = "WALLET" | "VNPAY";

export interface ItemRequest {
  title: string;
  description: string;
  condition: string; // NEW, LIKE_NEW, USED, FOR_PARTS
  categoryId: string;
  transactionType: string; // SELL, GIVEWAY
  price: number | null;
  postingFee: number;
  paymentMethod: PaymentMethod;
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
  expiredAt?: string | null;
  // Payment fields
  transactionId?: string;
  paymentUrl?: string;
  isFavorited?: boolean;
  favoriteCount?: number;
  paymentInitiatedAt?: string;
}

export type ItemStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "HIDDEN" | "ACTIVE" | "DRAFT" | "EXPIRED";
export type ItemCondition = "NEW" | "LIKE_NEW" | "USED" | "FOR_PARTS";
export type TransactionType = "SELL" | "GIVE_AWAY";

export type ItemWithImages = ItemResponse & {
  images?: ItemImageResponse[];
  favoriteCount?: number;
  isFavorited?: boolean;
  viewCount?: number;
};

export type PaginatedResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage?: number;
  pageSize?: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
};

// Report types
export type ReportCode = "FRAUD" | "COUNTERFEIT" | "FORBIDDEN" | "WRONG_CAT" | "SOLD_OUT";
export type ReportStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";

export interface ReportImageResponse {
  imageId: string;
  imageUrl: string;
}

export interface ReportRequest {
  code: ReportCode;
  reason: string;
  description?: string;
  itemId: string;
}

export interface ReportResponse {
  reportId: string;
  itemId: string;
  userId: string;
  reporterName?: string;
  code: ReportCode;
  reason: string;
  description?: string;
  status: ReportStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  adminNote?: string;
  images?: ReportImageResponse[];
  createdAt: string;
  updatedAt?: string;
}

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
};
