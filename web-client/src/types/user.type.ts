export type UserRole = "USER" | "ADMIN";

export type UserType = {
	userId: string;
	email: string;
	phoneNumber: string;
	role: UserRole;
	status: boolean;
	fullName?: string;
	avatarUrl?: string;
};

export type LoginPayload = {
	email: string;
	password: string;
};

export type RegisterPayload = {
	fullName: string;
	email: string;
	phoneNumber: string;
	password: string;
	confirmPassword: string;
};
