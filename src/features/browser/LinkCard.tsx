import { 
  Box, IconButton, Link, VStack, Image, Text, useColorModeValue, Flex
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useThemeStore } from '../../store/themeStore';
import type { LinkItem } from './api';


interface Props {
  link: LinkItem;
  onEdit: () => void;
  onDelete: () => void;
  isHome: boolean
}

export const LinkCard = ({ link, onDelete, onEdit, isHome=false }: Props) => {
  const bgItem = useColorModeValue('gray.50', 'gray.800');
  const { accentColor } = useThemeStore();

  return (
    <Box
      position="relative" 
      cursor = "pointer"
      role="group"
      bg={bgItem}
      p={6}
      borderRadius="md"
      _hover={{ shadow: 'md', transform: 'translateY(-2px)', transition: '0.2s', borderColor: 'gray.200', _dark: { borderColor: 'gray.600' }  }}
      border="1px solid" 
      borderColor={`${accentColor}.300`}
      color={`${accentColor}.400`}
    >
      {/* Кнопки управления */}
      {!isHome ?
      <Flex position="absolute" px={5} width="100%" justifyContent="space-between" top={1} right={0} opacity={0} _groupHover={{ opacity: 1 }} gap={1}>
        <IconButton aria-label='edit-button' icon={<EditIcon />} size="xs" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(); }} />
        <IconButton aria-label='delete-button' icon={<DeleteIcon />} size="xs" colorScheme="red" onClick={(e) => { e.stopPropagation(); onDelete(); }} />
      </Flex> : <></>
      }

      <Link href={link.url} isExternal _hover={{ textDecor: 'none' }} draggable={false} onDragStart={(e) => e.preventDefault()}>
        <VStack spacing={2}>
          <Image 
            src={link.icon_url} 
            boxSize="32px" 
            borderRadius="md"
            fallbackSrc="https://via.placeholder.com/32"
            pointerEvents="none" 
          />
          <Text fontSize="sm" noOfLines={1} fontWeight="medium" textAlign="center">
            {link.title}
          </Text>
        </VStack>
      </Link>
    </Box>
  );
}