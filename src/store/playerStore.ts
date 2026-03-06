import { create } from 'zustand';
import { type Track } from '../features/player/api';

export type RepeatMode = 'none' | 'one' | 'all';

interface PlayerState {
  isPlaying: boolean;
  currentTrack: Track | null;
  queue: Track[];
  originalQueue: Track[]; // для шаффла (чтобы вернуть порядок)
  currentIndex: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  
  // Действия
  setQueue: (tracks: Track[], startIndex?: number) => void;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentTrack: null,
  queue: [],
  originalQueue: [],
  currentIndex: -1,

  repeatMode: 'none',
  isShuffle: false,

  setQueue: (tracks, startIndex = 0) => {
    const isShuffle = get().isShuffle;
    let newQueue = [...tracks];
    
    if (isShuffle) {
      const first = newQueue[startIndex];
      const others = newQueue.filter((_, i) => i !== startIndex).sort(() => Math.random() - 0.5);
      newQueue = [first, ...others];
      startIndex = 0;
    }

    set({
      queue: newQueue,
      originalQueue: tracks,
      currentIndex: startIndex,
      currentTrack: newQueue[startIndex],
      isPlaying: true,
    });
  },

  playTrack: (track) => {
    set({ currentTrack: track, isPlaying: true });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  toggleRepeat: () => set((state) => {
    const modes: RepeatMode[] = ['none', 'all', 'one'];
    const nextIndex = (modes.indexOf(state.repeatMode) + 1) % modes.length;
    return { repeatMode: modes[nextIndex] };
  }),

  toggleShuffle: () => set((state) => {
    const newShuffle = !state.isShuffle;
    const currentTrack = state.currentTrack;
    
    if (newShuffle) {
      if (!currentTrack) return { isShuffle: true };
      
      const others = state.originalQueue.filter(t => t.id !== currentTrack.id).sort(() => Math.random() - 0.5);
      const newQueue = [currentTrack, ...others];
      
      return { 
        isShuffle: true, 
        queue: newQueue, 
        currentIndex: 0 
      };
    } else {
      if (!currentTrack) return { isShuffle: false };
      
      const originalIndex = state.originalQueue.findIndex(t => t.id === currentTrack.id);
      return { 
        isShuffle: false, 
        queue: state.originalQueue, 
        currentIndex: originalIndex 
      };
    }
  }),

  nextTrack: () => {
    const { queue, currentIndex, repeatMode } = get();
    
    if (repeatMode === 'one') {
       // логику обрабатываем в компоненте через audioRef
       return; 
    }

    if (currentIndex < queue.length - 1) {
      set({
        currentIndex: currentIndex + 1,
        currentTrack: queue[currentIndex + 1],
        isPlaying: true,
      });
    } else if (repeatMode === 'all') {
      set({
        currentIndex: 0,
        currentTrack: queue[0],
        isPlaying: true,
      });
    } else {
      set({ isPlaying: false });
    }
  },

  

  prevTrack: () => {
    const { queue, currentIndex } = get();
    if (currentIndex > 0) {
      set({
        currentIndex: currentIndex - 1,
        currentTrack: queue[currentIndex - 1],
        isPlaying: true,
      });
    }
  },
}));