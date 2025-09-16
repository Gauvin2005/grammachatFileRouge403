import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, AuthRequest, RegisterRequest } from '../types';
import apiService from '../services/api';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Actions asynchrones
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: AuthRequest, { rejectWithValue }) => {
    try {
      console.log('🔐 Tentative de connexion avec:', credentials.email);
      const response = await apiService.login(credentials);
      console.log('📥 Réponse API:', response);
      
      if (response.success && response.data) {
        await apiService.setAuthToken(response.data.token);
        await apiService.setUserData(response.data.user);
        console.log('✅ Connexion réussie');
        return response.data;
      } else {
        console.log('❌ Échec de connexion:', response.message);
        return rejectWithValue(response.message || 'Erreur de connexion');
      }
    } catch (error: any) {
      console.log('❌ Erreur lors de la connexion:', error);
      console.log('❌ Détails erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Erreur de connexion';
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.register(userData);
      if (response.success && response.data) {
        await apiService.setAuthToken(response.data.token);
        await apiService.setUserData(response.data.user);
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Erreur d\'inscription');
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur d\'inscription'
      );
    }
  }
);

export const loadUserProfile = createAsyncThunk(
  'auth/loadProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        await apiService.setUserData(response.data.user);
        return response.data.user;
      } else {
        return rejectWithValue(response.message || 'Erreur de chargement du profil');
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de chargement du profil'
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logout();
      return true;
    } catch (error: any) {
      return rejectWithValue('Erreur lors de la déconnexion');
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 Initialisation de l\'authentification...');
      
      // Test de connectivité d'abord
      try {
        await apiService.checkHealth();
        console.log('✅ Serveur accessible');
      } catch (error) {
        console.log('❌ Serveur inaccessible, initialisation sans token');
        return null;
      }
      
      const token = await apiService.getAuthToken();
      const userData = await apiService.getUserData();
      
      console.log('🔍 Token trouvé:', !!token);
      console.log('🔍 Données utilisateur trouvées:', !!userData);
      
      if (token && userData) {
        // Vérifier si le token est encore valide
        try {
          await apiService.getProfile();
          console.log('✅ Token valide, utilisateur connecté');
          return { token, user: userData };
        } catch (error) {
          console.log('❌ Token expiré, nettoyage des données');
          // Token expiré, nettoyer les données
          await apiService.logout();
          return null;
        }
      }
      
      console.log('ℹ️ Aucune session active');
      return null;
    } catch (error: any) {
      console.log('❌ Erreur d\'initialisation:', error);
      return rejectWithValue('Erreur d\'initialisation');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserXP: (state, action: PayloadAction<{ xp: number; level: number }>) => {
      if (state.user) {
        state.user.xp = action.payload.xp;
        state.user.level = action.payload.level;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      
      // Load Profile
      .addCase(loadUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loadUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.isLoading = false;
      })
      
      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, updateUserXP } = authSlice.actions;
export default authSlice.reducer;
