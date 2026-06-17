import { create } from 'zustand';

interface CardState {
  // Режим редактирования
  isEditMode: boolean;
  setIsEditMode: (mode: boolean) => void;

  // Хранилище временных файлов через blob
  pendingFiles: Record<string, File>;

  // Добавить файл в очередь
  addFile: (blobUrl: string, file: File) => void;

  // Получить файл при сохранении
  getFile: (blobUrl: string) => File | undefined;

  // Очистка
  clearFiles: () => void;
}

export const useCardStore = create<CardState>((set, get) => ({
  isEditMode: false,
  setIsEditMode: (mode) => set({ isEditMode: mode }),
  pendingFiles: {},

  addFile: (blobUrl, file) => set((state) => ({
    pendingFiles: { ...state.pendingFiles, [blobUrl]: file }
  })),

  getFile: (blobUrl) => get().pendingFiles[blobUrl],

  clearFiles: () => set({ pendingFiles: {} }),
}));