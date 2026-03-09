/**
 * User Types
 * User feature specific types
 */

import { User } from '@/types/user';

export interface UserState {
  profile: User | null;
  loading: boolean;
  error: string | null;
  updateSuccess: boolean;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  address?: string;
}
