import { Flex, Box, IconButton, Text, useColorModeValue } from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { FaPlay, FaPause } from 'react-icons/fa';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Track } from './api';

interface Props {
  track: Track;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  accentColor: string;
  onPlay: () => void;
  onTogglePlay: () => void;
  onDelete: () => void;
}

export const TrackRow = ({ track, isCurrent, isPlaying, accentColor, onPlay, onTogglePlay, onDelete }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative' as const,
    touchAction: 'pan-y',
    opacity: isDragging ? 0.9 : 1,
    boxShadow: isDragging ? 'lg' : 'none',
    transformOrigin: '50% 50%',
    scale: isDragging ? 1.02 : 1,
  };

  const bgHover = useColorModeValue('gray.50', 'gray.700');
  const bgCurrent = useColorModeValue(`${accentColor}.50`, `${accentColor}.900`);
  const bgBase = useColorModeValue('white', 'gray.800');

  return (
    <Flex 
      ref={setNodeRef} style={style}
      align="center" p={2} 
      bg={isCurrent ? bgCurrent : bgBase}
      borderRadius="md"
      borderBottom="1px solid" borderColor="gray.100"
      _hover={{ bg: isCurrent ? bgCurrent : bgHover }}
      {...attributes} 
      {...listeners}
    >

      {/* Кнопка Play */}
      <Box w="40px">
         <IconButton
           aria-label="Play" size="xs" rounded="full" colorScheme={accentColor}
           variant={isCurrent ? 'solid' : 'ghost'}
           icon={isCurrent && isPlaying ? <FaPause /> : <FaPlay />}
           onClick={isCurrent ? onTogglePlay : onPlay}
         />
      </Box>
      
      {/* Инфо */}
      <Box flex={1} overflow="hidden">
         <Text fontWeight="medium" noOfLines={1} fontSize="sm">{track.title}</Text>
         <Text color="gray.500" fontSize="xs" noOfLines={1}>{track.artist}</Text>
      </Box>
      
      {/* Удаление */}
      <Box>
          <IconButton 
            aria-label="Del" icon={<DeleteIcon />} size="xs" colorScheme="red" variant="ghost"
            onClick={onDelete}
          />
      </Box>
    </Flex>
  );
};