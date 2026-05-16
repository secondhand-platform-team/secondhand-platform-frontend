export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface PaymentResponse {
  id: string;
  transactionId: string;
  amount: number;
  responseCode: string | null;
  method: string;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  orderId: string | null;
  buyerId: string | null;
}

export interface PaymentListResponse {
  content: PaymentResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}
