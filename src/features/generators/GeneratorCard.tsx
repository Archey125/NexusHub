import { 
  Box, Heading, Button, IconButton, Text, Textarea, 
  useColorModeValue, Flex, Modal, ModalOverlay, ModalContent, 
  ModalHeader, ModalBody, ModalCloseButton, ModalFooter, useDisclosure 
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, RepeatIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type Generator, deleteGenerator, updateGenerator } from './api';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  generator: Generator;
}

export const GeneratorCard = ({ generator }: Props) => {
  const { accentColor } = useThemeStore();
  const bg = useColorModeValue('white', 'gray.700');
  const queryClient = useQueryClient();
  
  const [result, setResult] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [optionsText, setOptionsText] = useState(generator.options?.join('\n') || '');

  const deleteMutation = useMutation({
    mutationFn: deleteGenerator,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['generators'] })
  });

  const updateMutation = useMutation({
    mutationFn: (opts: string[]) => updateGenerator(generator.id, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generators'] });
      onClose();
    }
  });

  // Логика рулетки
  const handleSpin = () => {
    if (!generator.options || generator.options.length === 0) return;
    
    setIsSpinning(true);
    setResult(null);

    let count = 0;
    const maxCount = 10;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * generator.options.length);
      setResult(generator.options[randomIdx]);
      count++;
      if (count >= maxCount) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const handleSaveOptions = () => {
    // Разбиваем текст по строкам, убираем пустые
    const opts = optionsText.split('\n').map(s => s.trim()).filter(Boolean);
    updateMutation.mutate(opts);
  };

  return (
    <Box p={6} bg={bg} borderRadius="xl" boxShadow="md" position="relative" h="100%" display="flex" flexDirection="column">
      
      {/* Шапка */}
      <Flex justify="space-between" align="center" mb={4}>
        <Flex gap={1} width="100%" justifyContent="space-between">
           <IconButton aria-label="edit" icon={<EditIcon />} size="xs" variant="ghost" onClick={onOpen} />
           <Heading color={`${accentColor}.500`} size="lg" noOfLines={1}>{generator.title}</Heading>
           <IconButton aria-label="del" icon={<DeleteIcon />} size="xs" colorScheme="red" variant="ghost" onClick={() => confirm('Удалить?') && deleteMutation.mutate(generator.id)} />
        </Flex>
      </Flex>

      {/* Результат */}
      <Flex 
        flex={1} 
        align="center" 
        justify="center" 
        bg={useColorModeValue('gray.100', 'gray.800')} 
        borderRadius="lg" 
        p={4} 
        mb={4}
        minH="120px"
      >
        <Text 
          fontSize="xl" 
          fontWeight="bold" 
          color={isSpinning ? 'gray.500' : `${accentColor}.500`}
          textAlign="center"
        >
          {result || (generator.options?.length ? '?' : 'Пусто')}
        </Text>
      </Flex>

      {/* Кнопка */}
      <Button 
        w="100%" 
        colorScheme={accentColor} 
        leftIcon={<RepeatIcon />} 
        onClick={handleSpin}
        isLoading={isSpinning}
        isDisabled={!generator.options?.length}
      >
        Крутить
      </Button>

      {/* Модалка редактирования */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Настройки: {generator.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2} fontSize="sm" color="gray.500">Введите варианты (каждый с новой строки):</Text>
            <Textarea 
              value={optionsText} 
              onChange={(e) => setOptionsText(e.target.value)} 
              h="300px" 
              placeholder="Вариант 1&#10;Вариант 2&#10;Вариант 3"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Отмена</Button>
            <Button colorScheme={accentColor} onClick={handleSaveOptions} isLoading={updateMutation.isPending}>Сохранить</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
};