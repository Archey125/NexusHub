import { Box, Flex, Heading, IconButton, useDisclosure, Collapse, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, DragHandleIcon, SettingsIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  id: string;
  title: string;
  onDelete: () => void;
  onAdd: () => void;
  children: React.ReactNode;
}

export const CategoryContainer = ({ id, title, onDelete, onAdd, children }: Props) => {
  const { accentColor } = useThemeStore();
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });

  // для DnD
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative' as const,
    touchAction: 'none'
  };

  return (
    <Box 
      ref={setNodeRef} style={style}
      bg="white" _dark={{ bg: 'gray.800' }}
      borderRadius="lg" boxShadow="sm"
      borderTop="4px solid" borderColor={`${accentColor}.500`}
      mb={6}
    >
      {/* HEADER */}
      <Flex align="center" p={3} borderBottom="1px solid" borderColor="gray.100" _dark={{ borderColor: 'gray.700' }}>
        
        {/* Ручка DnD */}
        <Box mr={3} cursor="grab" color="gray.400" {...attributes} {...listeners}>
           <DragHandleIcon />
        </Box>

        {/* Свернуть/Развернуть */}
        <IconButton 
           aria-label="Toggle" icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />} 
           size="xs" variant="ghost" onClick={onToggle} mr={2}
        />

        <Heading size="md" flex={1} cursor="pointer" onClick={onToggle}>
           {title}
        </Heading>

        {/* Меню Действий */}
        <Menu>
           <MenuButton as={IconButton} icon={<SettingsIcon />} size="sm" variant="ghost" />
           <MenuList>
              <MenuItem icon={<AddIcon />} onClick={onAdd}>Добавить элемент</MenuItem>
              <MenuItem icon={<DeleteIcon />} color="red.500" onClick={onDelete}>Удалить категорию</MenuItem>
           </MenuList>
        </Menu>
      </Flex>

      {/* Контент */}
      <Collapse in={isOpen} animateOpacity>
        <Box p={4}>
           {children}
        </Box>
      </Collapse>
    </Box>
  );
};