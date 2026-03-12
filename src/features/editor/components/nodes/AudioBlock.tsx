/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeViewWrapper } from '@tiptap/react';
import { Box, Button, IconButton, Flex, Text, Select, VStack, HStack, useColorModeValue } from '@chakra-ui/react';
import { DeleteIcon, AttachmentIcon, RepeatIcon } from '@chakra-ui/icons';
import { FaPlay, FaPause, } from 'react-icons/fa';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCardStore } from '../../../../store/cardStore';
import { getAllAudioCategories, getTracks } from '../../../player/api';
import { usePlayerStore } from '../../../../store/playerStore';
import { SpoilerWrapper, SpoilerButton } from '../SpoilerWrapper';

export const AudioBlock = (props: any) => {
  const { src, title, artist, playlistTrackId, trackType, isSpoiler } = props.node.attrs; 
  // trackType: 'file' | 'playlist'
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // cостояние выбора трека
  const [isSelecting, setIsSelecting] = useState(!src);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const addFile = useCardStore((state) => state.addFile);
  
  const { data: playlists } = useQuery({ 
    queryKey: ['сategories-audio'],
    queryFn: getAllAudioCategories, 
    enabled: isSelecting
  });
  const { data: tracks } = useQuery({ 
    queryKey: ['tracks', selectedPlaylist], 
    queryFn: () => getTracks(selectedPlaylist),
    enabled: !!selectedPlaylist 
  });

  const isEditable = props.editor.isEditable;

  const isCurrentPlaying = (trackType === 'playlist' && currentTrack?.id === playlistTrackId) || currentTrack?.url === src;

  const bg = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.600');

  // загрузка blob
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);
    addFile(blobUrl, file);

    const name = file.name.replace(/\.[^/.]+$/, "");
    
    props.updateAttributes({ 
      src: blobUrl, 
      title: name, 
      artist: 'Card Upload', 
      trackType: 'file',
      playlistTrackId: null // сброс плейлиста
    });
    setIsSelecting(false);
  };

  // выбор из плейлиста
  const handleSelectTrack = (trackId: string) => {
    const track = tracks?.find(t => t.id === trackId);
    if (track) {
      props.updateAttributes({
        src: track.url, // ссылка из базы
        title: track.title,
        artist: track.artist,
        playlistTrackId: track.id,
        trackType: 'playlist'
      });
      setIsSelecting(false);
    }
  };

  const handleDelete = () => {
    props.deleteNode();
  };

  const handlePlay = () => {
    if (isCurrentPlaying) {
      togglePlay();
    } else {
      playTrack({
        id: playlistTrackId || src, 
        title: title || 'Unknown',
        artist: artist || '',
        url: src,
        category_id: 'card',
        // Заглушки
        storage_path: src,
        sort_order: 0,
        duration: 0          
      });
    }
  };

  return (
    <NodeViewWrapper className="react-component-audio">
      <SpoilerWrapper 
        isSpoiler={isSpoiler} 
        isEditable={isEditable}
      >
      <Box 
        my={4} p={3} borderRadius="md" bg={bg}
        border={isEditable ? "1px dashed" : "1px solid"} borderColor={isEditable ? borderColor : "transparent"}
      >

        {isSelecting ? (
          // РЕЖИМ ВЫБОРА
          <VStack spacing={3} align="stretch">
            <Text fontSize="sm" fontWeight="bold" color="gray.500">Добавить аудио</Text>
            
            <HStack>
               <Button size="sm" leftIcon={<AttachmentIcon />} onClick={() => fileInputRef.current?.click()}>
                 Загрузить файл
               </Button>
               <Text fontSize="xs" color="gray.500">или из библиотеки:</Text>
            </HStack>

            <Select placeholder="Выберите плейлист" size="sm" onChange={(e) => setSelectedPlaylist(e.target.value)}>
              {playlists?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>

            {selectedPlaylist && (
               <Select placeholder="Выберите трек" size="sm" onChange={(e) => handleSelectTrack(e.target.value)}>
                  {tracks?.map(t => <option key={t.id} value={t.id}>{t.artist} - {t.title}</option>)}
               </Select>
            )}
            
            {/* отменить выбор */}
            {src && (
               <Button size="xs" variant="ghost" onClick={() => setIsSelecting(false)}>Отмена</Button>
            )}
            
            <input type="file" hidden ref={fileInputRef} onChange={handleUpload} accept="audio/*" />
          </VStack>
        ) : (
          // ПЛЕЕР
          <Flex align="center" gap={3}>
            <IconButton
              aria-label="Play"
              icon={isCurrentPlaying && isPlaying ? <FaPause /> : <FaPlay />}
              colorScheme="blue" rounded="full" onClick={handlePlay}
            />
            
            <VStack align="flex-start" spacing={0} flex={1} overflow="hidden">
               <Text fontWeight="bold" noOfLines={1}>{title}</Text>
               <Text fontSize="xs" color="gray.500">{artist}</Text>
            </VStack>

            {isEditable && (
              <HStack>
                {/* замена */}
                <IconButton aria-label="Swap" icon={<RepeatIcon />} size="sm" onClick={() => setIsSelecting(true)} />
                <IconButton aria-label="Delete" icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={handleDelete} />
                {/* спойлер */}
                <SpoilerButton isSpoiler={isSpoiler} onClick={() => props.updateAttributes({ isSpoiler: !isSpoiler })} />
              </HStack>
            )}
          </Flex>
        )}
      </Box>
      </SpoilerWrapper>
    </NodeViewWrapper>
  );
};