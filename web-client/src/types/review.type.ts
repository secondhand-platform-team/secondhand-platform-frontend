export interface ReviewRequest {
  rating: number;
  comment: string;
}

export interface ReviewResponse {
  id: string;
  itemId: string;
  rating: number;
  comment: string;
  buyerId: string;
  buyerName?: string;
  buyerAvatar?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewListResponse {
  reviews: ReviewResponse[];
  averageRating: number;
  totalReviews: number;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}
