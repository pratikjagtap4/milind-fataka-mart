export type Role = 'SUPER_ADMIN' | 'OWNER' | 'CUSTOMER';

export interface User {
  id: number;
  email: string;
  fullName: string;
  mobile: string;
  role: Role;
  shopId?: number | null;
  shopName?: string | null;
  branchCode?: string | null;
  address?: string | null;
  referredBy?: string | null;
  isEnabled: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  mobile: string;
  role: Role;
  shopId?: number | null;
  shopName?: string | null;
  branchCode?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}
