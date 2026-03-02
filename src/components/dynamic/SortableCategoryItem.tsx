import { Box, Text } from '@chakra-ui/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  id: string;
  title: string;
  isSelected: boolean;
  onClick: () => void;
  accentColor: string;
}

export const SortableCategoryItem = ({ id, title, isSelected, onClick, accentColor }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative' as const,
    touchAction: 'pan-y'
  };

  return (
    <Box
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      p={3}
      borderRadius="md"
      cursor="pointer"
      bg={isSelected ? `${accentColor}.100` : 'transparent'}
      color={isSelected ? `${accentColor}.700` : 'inherit'}
      fontWeight={isSelected ? 'bold' : 'normal'}
      _dark={{ 
         bg: isSelected ? `${accentColor}.900` : 'transparent',
         color: isSelected ? `${accentColor}.200` : 'inherit'
      }}
      _hover={{ bg: isSelected ? `${accentColor}.200` : 'gray.100', _dark: { bg: isSelected ? `${accentColor}.800` : 'gray.700' } }}
      onClick={onClick}
    >
      <Text noOfLines={1}>{title}</Text>
    </Box>
  );
};