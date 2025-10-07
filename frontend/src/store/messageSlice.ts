import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MessageState, Message, MessageRequest, PaginationParams } from '../types';
import { optimizedApi } from '../services/optimizedApi';
import { messagePersistence } from '../services/messagePersistence';

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
      const response = await optimizedApi.sendMessage(messageData);
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
  async (params: PaginationParams = {}, { rejectWithValue, getState }) => {
    try {
      // Récupérer les messages sauvegardés localement d'abord
      const localMessages = await messagePersistence.getSavedMessages();
      
      // Vérifier si une synchronisation est nécessaire
      const needsSync = await messagePersistence.needsSync();
      
      if (needsSync) {
        console.log('Synchronisation nécessaire, récupération depuis le serveur');
        // Récupérer les messages depuis le serveur
        const response = await optimizedApi.getMessages(params, { useCache: true });
        
        if (response.success && response.data) {
          // Fusionner avec les messages locaux
          const mergedMessages = await messagePersistence.mergeMessages(response.data.data);
          await messagePersistence.markSyncComplete();
          
          return { 
            data: mergedMessages, 
            pagination: response.data.pagination 
          };
        }
      }
      
      // Si pas de sync nécessaire ou erreur serveur, utiliser les messages locaux
      if (localMessages.length > 0) {
        console.log(`Utilisation des messages locaux: ${localMessages.length} messages`);
        return { 
          data: localMessages, 
          pagination: null 
        };
      }
      
      // Dernière tentative avec le serveur
      const response = await optimizedApi.getMessages(params, { useCache: true });
      if (response.success && response.data) {
        await messagePersistence.saveMessages(response.data.data);
        await messagePersistence.markSyncComplete();
        return response.data;
      }
      
      // Retourner des données vides plutôt que d'échouer
      return { data: [], pagination: null };
    } catch (error: any) {
      console.log('Erreur dans fetchMessages (gérée):', error.message);
      
      // En cas d'erreur, essayer de récupérer les messages locaux
      const localMessages = await messagePersistence.getSavedMessages();
      if (localMessages.length > 0) {
        console.log(`Fallback vers messages locaux: ${localMessages.length} messages`);
        return { 
          data: localMessages, 
          pagination: null 
        };
      }
      
      // Retourner des données vides plutôt que de faire échouer l'action
      return { data: [], pagination: null };
    }
  }
);

export const fetchMessage = createAsyncThunk(
  'messages/fetchOne',
  async (messageId: string, { rejectWithValue, getState }) => {
    try {
      // Vérifier si le message est déjà dans le store
      const state = getState() as { messages: MessageState };
      const existingMessage = state.messages.messages.find(msg => msg.id === messageId);
      if (existingMessage) {
        console.log('Message déjà chargé, utilisation du cache');
        return existingMessage;
      }

      // Utiliser l'API service pour récupérer un message spécifique
      const { apiService } = await import('../services/api');
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
      // Utiliser l'API service pour supprimer un message
      const { apiService } = await import('../services/api');
      const response = await apiService.deleteMessage(messageId);
      if (response.success) {
        // Invalider le cache des messages après suppression
        optimizedApi.invalidateMessagesCache();
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
      
      // Utiliser l'API optimisée pour charger plus de messages
      const response = await optimizedApi.getMessages({ ...params, page: nextPage }, { useCache: false });
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

export const loadMessagesFromCache = createAsyncThunk(
  'messages/loadFromCache',
  async (_, { rejectWithValue }) => {
    try {
      const localMessages = await messagePersistence.getSavedMessages();
      return { data: localMessages, pagination: null };
    } catch (error: any) {
      return rejectWithValue('Erreur lors du chargement du cache local');
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
      state.messages.push(action.payload);
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
        state.messages.push(action.payload.message);
        state.error = null;
        
        // Sauvegarder le nouveau message localement
        messagePersistence.addMessage(action.payload.message);
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
      })
      
      // Load Messages From Cache
      .addCase(loadMessagesFromCache.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadMessagesFromCache.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(loadMessagesFromCache.rejected, (state, action) => {
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
