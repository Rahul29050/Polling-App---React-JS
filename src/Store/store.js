import { configureStore, createSlice } from '@reduxjs/toolkit';

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState: JSON.parse(localStorage.getItem('user')) || null,
  reducers: {
    setUser: (state, action) => {
      return action.payload;
    },
    clearUser: () => null,
  },
});

// Root reducer
const rootReducer = {
  user: userSlice.reducer,
};

// Actions
export const { setUser, clearUser } = userSlice.actions;

// Thunks
export const logout = () => (dispatch) => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  dispatch(clearUser());
};

export const login = (userData, token) => (dispatch) => {
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('token', token);
  dispatch(setUser(userData));
};

// Create store
const store = configureStore({
  reducer: rootReducer,
});

export default store;