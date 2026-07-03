import { createSlice } from '@reduxjs/toolkit';

const storedTheme = localStorage.getItem('theme') || 'dark';

// Apply initial theme immediately to body
if (storedTheme === 'dark') {
  document.body.classList.add('dark');
} else {
  document.body.classList.remove('dark');
}

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    mode: storedTheme,
  },
  reducers: {
    toggleTheme: (state) => {
      const nextMode = state.mode === 'light' ? 'dark' : 'light';
      state.mode = nextMode;
      localStorage.setItem('theme', nextMode);

      if (nextMode === 'dark') {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    },
    setTheme: (state, action) => {
      const mode = action.payload;
      state.mode = mode;
      localStorage.setItem('theme', mode);

      if (mode === 'dark') {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
