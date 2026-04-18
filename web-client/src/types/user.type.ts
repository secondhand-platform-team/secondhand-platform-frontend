export type UserRole = "USER" | "ADMIN";

export type UserType = {
	userId: string;
	email: string;
	phoneNumber: string;
	role: UserRole;
	status: boolean;
	fullName?: string;
	avatarUrl?: string;
	freeSellUse?: number;
	freeSellUsed?: number;
};

export type UserProfileType = {
	fullName?: string;
	avatarUrl?: string;
	dateOfBirth?: string;
	gender?: string;
	bio?: string;
};

export type UserInfoApiType = {
	userId: string;
	email: string;
	phoneNumber: string;
	role: UserRole;
	status: boolean;
	freeSellUse?: number;
	freeSellUsed?: number;
};

export type UserProfileApiResponseType = {
	user: UserInfoApiType;
	user_profile?: UserProfileType | null;
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
