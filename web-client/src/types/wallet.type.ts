export type WalletResponse = {
	id: string;
	userId: string;
	balance: number;
};

export type DepositRequest = {
	amount: number;
	bankCode?: string;
	language?: string;
};

export type WalletTransactionType = "DEPOSIT" | "WITHDRAW" | "PAYMENT" | "REFUND" | "ESCROW_HOLD" | "ESCROW_RELEASE" | "ESCROW_REFUND";

export type WalletTransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export type WalletTransactionResponse = {
	id: string;
	amount: number;
	type: WalletTransactionType;
	status: WalletTransactionStatus;
	referenceId?: string | null;
	createdAt: string;
};

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

export type DepositResponse = {
	message?: string;
	paymentUrl?: string;
	redirectUrl?: string;
	url?: string;
	data?: {
		paymentUrl?: string;
		redirectUrl?: string;
		url?: string;
		message?: string;
	};
};