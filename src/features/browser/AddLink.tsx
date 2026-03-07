import { 
    Box, Text, useColorModeValue, VStack, 
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useThemeStore } from '../../store/themeStore';


interface Props {
  handleOpenCreate: () => void;
}

export const AddLink = ({ handleOpenCreate }: Props) => {
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
      borderStyle="dashed"
      color={`${accentColor}.400`}
      onClick={handleOpenCreate}
    >
        <VStack spacing={2}>
          <AddIcon 
            boxSize="32px" 
            borderRadius="md"
            pointerEvents="none" 
          />
          <Text fontSize="sm" noOfLines={1} fontWeight="medium" textAlign="center">
            Добавить
          </Text>
        </VStack>
    </Box>
  );
}