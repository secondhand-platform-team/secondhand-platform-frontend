export interface OrderItem {
  id: string;
  itemId: string;
  itemName: string;
  sellerId: string;
  price: number;
  quantity: number;
  itemImageUrl?: string;
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

export interface Shipment {
  id: string;
  carrier: string;
  trackingCode: string;
  status: string;
  shippedAt: string;
  deliveredAt: string | null;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  disputeReason?: string;
  cancelReason?: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  payment: Payment | null;
  shipment: Shipment | null;
}

export interface OrderEvent {
  id: string;
  eventType: string;
  triggeredBy: string;
  actorRole: string;
  metadata?: Record<string, any>;
  occurredAt: string;
  orderSnapshot?: any;
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  disputedCount: number;
  pendingPaymentCount: number;
  todayOrders?: number;
}
