import { create } from 'zustand';
import type { AppView, ChatMessage, Subject, User } from './types';

const STORAGE_KEY = 'kotaai_user';

function loadUserFromStorage(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function saveUserToStorage(user: User | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

interface AppState {
  currentView: AppView;
  user: User | null;
  selectedSubject: Subject;
  chatMessages: ChatMessage[];
  isLoading: boolean;

  setView: (view: AppView) => void;
  setUser: (user: User | null) => void;
  setSelectedSubject: (subject: Subject) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  setIsLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()((set) => {
  // Initialise user from localStorage on store creation
  const persistedUser = loadUserFromStorage();

  return {
    currentView: 'landing',
    user: persistedUser,
    selectedSubject: 'Physics',
    chatMessages: [],
    isLoading: false,

    setView: (view) => set({ currentView: view }),

    setUser: (user) => {
      saveUserToStorage(user);
      set({ user });
    },

    setSelectedSubject: (subject) => set({ selectedSubject: subject }),

    addChatMessage: (message) =>
      set((state) => ({ chatMessages: [...state.chatMessages, message] })),

    setChatMessages: (messages) => set({ chatMessages: messages }),

    setIsLoading: (loading) => set({ isLoading: loading }),

    logout: () => {
      saveUserToStorage(null);
      set({
        user: null,
        currentView: 'landing',
        chatMessages: [],
      });
    },
  };
});
