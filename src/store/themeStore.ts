import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  accentColor: string;
  setAccentColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      accentColor: 'cyan', // цвет по умолчанию
      setAccentColor: (color) => set({ accentColor: color }),
    }),
    { name: 'nexushub-theme' }
  )
);