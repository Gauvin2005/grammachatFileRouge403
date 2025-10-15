import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { fetchUsers, fetchLeaderboard } from '../store/userSlice';

/**
 * Hook personnalisé pour synchroniser automatiquement les données utilisateurs
 * Utilisé dans les écrans qui affichent des informations d'XP
 */
export const useXPSync = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { users, leaderboard } = useAppSelector((state) => state.users);

  useEffect(() => {
    // Charger les utilisateurs si la liste est vide
    if (users.length === 0) {
      dispatch(fetchUsers());
    }
    
    // Charger le leaderboard si la liste est vide
    if (leaderboard.length === 0) {
      dispatch(fetchLeaderboard());
    }
  }, [dispatch, users.length, leaderboard.length]);

  return {
    users,
    leaderboard,
    currentUser: user,
  };
};

