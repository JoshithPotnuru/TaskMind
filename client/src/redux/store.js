import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import themeReducer from './slices/themeSlice.js';
import chatReducer from './slices/chatSlice.js';

const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // allow dates and non-serialized objects if needed
    }),
});

export default store;
