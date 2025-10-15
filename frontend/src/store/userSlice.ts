import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { optimizedApi } from '../services/optimizedApi';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  xp: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}

interface UserState {
  users: User[];
  leaderboard: Array<{
    username: string;
    xp: number;
    level: number;
    rank: number;
  }>;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  leaderboard: [],
  isLoading: false,
  error: null,
};

// Actions asynchrones
export const fetchUsers = createAsyncThunk(
  'users/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await optimizedApi.getUsers();
      if (response.success && response.data) {
        return response.data.data;
      } else {
        return rejectWithValue(response.message || 'Erreur de récupération des utilisateurs');
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de récupération des utilisateurs'
      );
    }
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'users/fetchLeaderboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await optimizedApi.getLeaderboard();
      if (response.success && response.data) {
        return response.data.leaderboard;
      } else {
        return rejectWithValue(response.message || 'Erreur de récupération du leaderboard');
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de récupération du leaderboard'
      );
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserXP: (state, action: PayloadAction<{ userId: string; xp: number; level: number }>) => {
      const { userId, xp, level } = action.payload;
      
      // Mettre à jour dans la liste des utilisateurs
      const userIndex = state.users.findIndex(user => user.id === userId);
      if (userIndex !== -1) {
        state.users[userIndex].xp = xp;
        state.users[userIndex].level = level;
      }
      
      // Mettre à jour dans le leaderboard
      const leaderboardIndex = state.leaderboard.findIndex(entry => entry.username === state.users[userIndex]?.username);
      if (leaderboardIndex !== -1) {
        state.leaderboard[leaderboardIndex].xp = xp;
        state.leaderboard[leaderboardIndex].level = level;
        
        // Re-trier le leaderboard par XP décroissant
        state.leaderboard.sort((a, b) => b.xp - a.xp);
        
        // Mettre à jour les rangs
        state.leaderboard.forEach((entry, index) => {
          entry.rank = index + 1;
        });
      }
    },
    invalidateUsersCache: (state) => {
      // Cette action sera utilisée pour forcer un refresh des données
      state.users = [];
      state.leaderboard = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.leaderboard = action.payload;
        state.error = null;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateUserXP, invalidateUsersCache } = userSlice.actions;
export default userSlice.reducer;

