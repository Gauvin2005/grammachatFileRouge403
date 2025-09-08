import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MessageState, Message, MessageRequest, PaginationParams } from '@/types';
import apiService from '@/services/api';

const initialState: MessageState = {
  messages: [],
  isLoading: false,
  error: null,
  pagination: null,
};

// Actions asynchrones
export const sendMessage = createAsyncThunk(
  'messages/send',
  async (messageData: MessageRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.sendMessage(messageData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Erreur d\'envoi du message');
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur d\'envoi du message'
      );
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messages/fetch',
  async (params?: PaginationParams, { rejectWithValue }) => {
    try {
      const response = await apiService.getMessages(params);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Erreur de récupération des messages');
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de récupération des messages'
      );
    }
  }
);

export const fetchMessage = createAsyncThunk(
  'messages/fetchOne',
  async (messageId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getMessage(messageId);
      if (response.success && response.data) {
        return response.data.message;
      } else {
        return rejectWithValue(response.message || 'Erreur de récupération du message');
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de récupération du message'
      );
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'messages/delete',
  async (messageId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.deleteMessage(messageId);
      if (response.success) {
        return messageId;
      } else {
        return rejectWithValue(response.message || 'Erreur de suppression du message');
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de suppression du message'
      );
    }
  }
);

export const loadMoreMessages = createAsyncThunk(
  'messages/loadMore',
  async (params: PaginationParams, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { messages: MessageState };
      const currentPage = state.messages.pagination?.page || 1;
      const nextPage = currentPage + 1;
      
      const response = await apiService.getMessages({ ...params, page: nextPage });
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Erreur de chargement des messages');
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de chargement des messages'
      );
    }
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.pagination = null;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.unshift(action.payload);
    },
    updateMessage: (state, action: PayloadAction<Message>) => {
      const index = state.messages.findIndex(msg => msg.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
    },
    removeMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(msg => msg.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages.unshift(action.payload.message);
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Message
      .addCase(fetchMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        const existingIndex = state.messages.findIndex(msg => msg.id === action.payload.id);
        if (existingIndex !== -1) {
          state.messages[existingIndex] = action.payload;
        } else {
          state.messages.push(action.payload);
        }
        state.error = null;
      })
      .addCase(fetchMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete Message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter(msg => msg.id !== action.payload);
        if (state.pagination) {
          state.pagination.total -= 1;
        }
      })
      
      // Load More Messages
      .addCase(loadMoreMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadMoreMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = [...state.messages, ...action.payload.data];
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(loadMoreMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  clearMessages, 
  addMessage, 
  updateMessage, 
  removeMessage 
} = messageSlice.actions;
export default messageSlice.reducer;
