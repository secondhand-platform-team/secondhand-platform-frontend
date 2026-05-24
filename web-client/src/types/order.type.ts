export interface OrderItemType {
  id: string;
  itemId: string;
  itemName: string;
  sellerId: string;
  price: number;
  itemImageUrl?: string;
}

export interface ShipmentType {
  id: string;
  carrier: string;
  trackingCode: string;
  status: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface OrderType {
  id: string;
  buyerId: string;
  sellerId: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  escrowTransactionId?: string;
  autoCompleteAt?: string;
  cancelReason?: string;
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItemType[];
  shipment: ShipmentType | null;
}
