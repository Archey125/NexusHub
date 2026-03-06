/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Button, Spinner, VStack, useToast, } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { usePlayerStore } from '../../store/playerStore';
import { getTracks, uploadTrack, deleteTrack, updateTracksOrder, type Track } from '../../features/player/api';
import { TrackRow } from '../../features/player/TrackRow';

// DnD
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export const CategoryAudio = ({ id }: { id: string }) => {
  const { accentColor } = useThemeStore();
  const { setQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const toast = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);

  const { data: serverTracks, isLoading } = useQuery({ 
    queryKey: ['tracks', id], 
    queryFn: () => getTracks(id) 
  });

  // локальный стейт
  const [tracks, setTracks] = useState<Track[]>([]);
  useEffect(() => {
    if (serverTracks) {
        const timeout = setTimeout(() => {
            setTracks(prev => JSON.stringify(prev) === JSON.stringify(serverTracks) ? prev : serverTracks);
        }, 0);
        return () => clearTimeout(timeout);
    }
  }, [serverTracks]);

  const uploadMutation = useMutation({
    mutationFn: uploadTrack,
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['tracks', id] });
       toast({ title: 'Трек загружен', status: 'success' });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, status: 'error' })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTrack,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracks', id] })
  });

  const reorderMutation = useMutation({ mutationFn: updateTracksOrder });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setIsUploading(true);
    for (const file of Array.from(e.target.files)) {
      await uploadMutation.mutateAsync({ file, categoryId: id });
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePlay = (index: number) => {
    setQueue(tracks, index);
  };

  //DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tracks.findIndex(t => t.id === active.id);
    const newIndex = tracks.findIndex(t => t.id === over.id);
    const newOrder = arrayMove(tracks, oldIndex, newIndex);
    setTracks(newOrder);
    reorderMutation.mutate(newOrder.map((t, i) => ({ id: t.id, sort_order: i })));
  };

  if (isLoading) return <Spinner />;

  return (
    <Box>
      <Button 
        leftIcon={<AddIcon />} mb={4} colorScheme={accentColor} variant="outline"
        onClick={() => fileInputRef.current?.click()} 
        isLoading={isUploading} loadingText="Загрузка..."
      >
        Загрузить MP3
      </Button>
      <input type="file" multiple accept="audio/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleUpload} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tracks.map(t => t.id)} strategy={verticalListSortingStrategy}>
           <VStack spacing={1} align="stretch" overflow="hidden" height="100vh">
              {tracks.map((track, index) => (
                 <TrackRow 
                   key={track.id}
                   track={track}
                   index={index}
                   isCurrent={currentTrack?.id === track.id}
                   isPlaying={isPlaying}
                   accentColor={accentColor}
                   onPlay={() => handlePlay(index)}
                   onTogglePlay={togglePlay}
                   onDelete={() => deleteMutation.mutate(track)}
                 />
              ))}
           </VStack>
        </SortableContext>
      </DndContext>
    </Box>
  );
};