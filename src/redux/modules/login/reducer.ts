import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserInfo, LoginState} from '@/redux/modules/types'; 
// Define a more specific UserInfo interface based on actual user data.

const initialState: LoginState = {
  showLoginModal: false,
  isLogin: false,
  userInfo: null,
  showLogoutModal: false,
};

const loginSlice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    // Toggle login modal visibility
    toggleLoginModal: (state, action: PayloadAction<boolean | undefined>) => {
      state.showLoginModal = action.payload ?? !state.showLoginModal;
    },
    
    // Change the login state (e.g., when the user successfully logs in or logs out)
    changeLoginState: (state, action: PayloadAction<boolean | undefined>) => {
      state.isLogin = action.payload ?? !state.isLogin;
    },
    
    // Set user information
    setUserInfo: (state, action: PayloadAction<UserInfo>) => {
      state.userInfo = { ...action.payload };
    },

    // Toggle logout modal visibility
    toggleLogoutModal: (state, action: PayloadAction<boolean | undefined>) => {
      state.showLogoutModal = action.payload ?? !state.showLogoutModal;
    },

    // Optional: Reset the state to initial state (useful for logging out)
    resetLoginState: (state) => {
      state.showLoginModal = false;
      state.isLogin = false;
      state.userInfo = null;
      state.showLogoutModal = false;
    }
  },
});

export default loginSlice.reducer;

export const {
  toggleLoginModal,
  changeLoginState,
  setUserInfo,
  toggleLogoutModal,
  resetLoginState,
} = loginSlice.actions;
