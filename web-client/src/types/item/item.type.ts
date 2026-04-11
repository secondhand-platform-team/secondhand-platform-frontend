export type ItemStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "HIDDEN" | "ACTIVE";
export type ItemCondition = "NEW" | "LIKE_NEW" | "USED" | "FOR_PARTS";
export type TransactionType = "SELL" | "GIVE_AWAY";

export type CategoryType = {
  categoryId: string;
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  postingFee?: number;
};

export type LocationPayload = {
  address: string;
  ward?: string;
  district?: string;
  city?: string;
};

export type ItemImagePayload = {
  imageUrl: string;
  isPrimary?: boolean;
};

export type ItemRequestPayload = {
  title: string;
  description?: string;
  categoryId: string;
  price: number;
  condition?: ItemCondition;
  transactionType?: TransactionType;
  status?: ItemStatus;
  location?: LocationPayload;
  itemImageList?: ItemImagePayload[];
  attributes?: Array<{ code: string; value: unknown }>;
};

export type ItemResponseType = {
  itemId: string;
  title: string;
  description?: string;
  categoryId: string;
  price: number;
  condition?: ItemCondition;
  transactionType?: TransactionType;
  status?: ItemStatus;
  location?: LocationPayload;
  userId: string;
  createdAt: string;
  updatedAt: string;
  itemImageList?: Array<{ imageUrl: string; isPrimary?: boolean }>;
  paymentUrl?: string;
};

export type MessageResponseType = {
  message: string;
  success: boolean;
};
