/**
 * Root Reducer
 * Combines all feature reducers into a single root reducer
 */

import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import userReducer from '@/features/user/userSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
});

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
