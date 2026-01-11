import { configureStore } from "@reduxjs/toolkit"
import { authApi } from "./api/authApi"
import { customersApi } from "./api/customersApi"
import { couponsApi } from "./api/couponsApi"
import { faqsApi } from "./api/faqsApi"
import { contactsApi } from "./api/contactsApi"
import { categoriesApi } from "./api/categoriesApi"
import { reviewsApi } from "./api/reviewsApi"
import { bookingsApi } from "./api/bookingsApi"
import { categoryRequestsApi } from "./api/categoryRequestsApi"

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [customersApi.reducerPath]: customersApi.reducer,
    [couponsApi.reducerPath]: couponsApi.reducer,
    [faqsApi.reducerPath]: faqsApi.reducer,
    [contactsApi.reducerPath]: contactsApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
    [bookingsApi.reducerPath]: bookingsApi.reducer,
    [categoryRequestsApi.reducerPath]: categoryRequestsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, customersApi.middleware, couponsApi.middleware, faqsApi.middleware, contactsApi.middleware, categoriesApi.middleware, reviewsApi.middleware, bookingsApi.middleware, categoryRequestsApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

