import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/auth.slice'
import themeReducer from './slices/theme.slice'
import itemReducer from './slices/item.slice'
import categoryReducer from './slices/category.slice'
import reportReducer from './slices/report.slice'

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      theme: themeReducer,
      item: itemReducer,
      category: categoryReducer,
      report: reportReducer,
    },
  })
}

export const store = makeStore();

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']