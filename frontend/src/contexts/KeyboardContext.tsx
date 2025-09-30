import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Keyboard, Platform } from 'react-native';

interface KeyboardContextType {
  keyboardHeight: number;
  isKeyboardVisible: boolean;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

interface KeyboardProviderProps {
  children: ReactNode;
}

export const KeyboardProvider: React.FC<KeyboardProviderProps> = ({ children }) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      console.log('Keyboard shown, height:', e.endCoordinates.height);
      setKeyboardHeight(e.endCoordinates.height);
      setIsKeyboardVisible(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('Keyboard hidden');
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const value: KeyboardContextType = {
    keyboardHeight,
    isKeyboardVisible,
  };

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
};

export const useKeyboard = (): KeyboardContextType => {
  const context = useContext(KeyboardContext);
  if (context === undefined) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
};
