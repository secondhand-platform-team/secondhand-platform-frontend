export type NotificationType =
  | "ITEM_FAVORITED"
  | "ITEM_COMMENTED"
  | "ITEM_REPORTED"
  | "GIVEAWAY_REQUEST"
  | "SYSTEM"
  | "WALLET_DEPOSIT_SUCCESS"
  | "WALLET_DEDUCTION";

export interface Notification {
  id: string;
  userId: string;
  content: string;
  type: NotificationType;
  itemId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type NotificationResponse = PageResponse<Notification>;
