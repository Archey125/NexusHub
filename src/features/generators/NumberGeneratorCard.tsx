import { 
  Box, Heading, Button, IconButton, Text, useColorModeValue, Flex, 
  HStack, NumberInput, NumberInputField 
} from '@chakra-ui/react';
import { DeleteIcon, RepeatIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type Generator, deleteGenerator, updateGenerator } from './api';
import { useThemeStore } from '../../store/themeStore';

interface Props { generator: Generator; }

export const NumberGeneratorCard = ({ generator }: Props) => {
  const { accentColor } = useThemeStore();
  const bg = useColorModeValue('white', 'gray.700');
  const queryClient = useQueryClient();
  
  // Берем min/max из options или ставим дефолт
  const [min, setMin] = useState(generator.options?.[0] || '1');
  const [max, setMax] = useState(generator.options?.[1] || '100');
  
  const [result, setResult] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: deleteGenerator,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['generators'] })
  });

  const updateMutation = useMutation({
    mutationFn: (opts: string[]) => updateGenerator(generator.id, opts)
  });

  const handleSpin = () => {
    setIsSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      const minVal = parseInt(min);
      const maxVal = parseInt(max);
      const rnd = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
      setResult(rnd);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 50);
  };

  const handleBlur = () => {
     updateMutation.mutate([min, max]);
  };

  return (
    <Box p={6} bg={bg} borderRadius="xl" boxShadow="md" h="100%" display="flex" flexDirection="column">
      <Flex justify="space-between" align="center" mb={4}>
        <IconButton aria-label="del" size="xs" variant="ghost"/>
        <Heading color={`${accentColor}.500`} size="lg" noOfLines={1}>{generator.title}</Heading>
        <IconButton aria-label="del" icon={<DeleteIcon />} size="xs" colorScheme="red" variant="ghost" onClick={() => confirm('Удалить?') && deleteMutation.mutate(generator.id)} />
      </Flex>

      <Flex flex={1} align="center" justify="center" bg={useColorModeValue('gray.100', 'gray.800')} borderRadius="lg" mb={4} minH="100px">
        <Text fontSize="4xl" fontWeight="bold" color={isSpinning ? 'gray.500' : `${accentColor}.500`}>
          {result !== null ? result : '?'}
        </Text>
      </Flex>

      <HStack mb={4} spacing={2} justifyContent="space-between">
         <NumberInput size="sm" value={min} onChange={(val) => setMin(val)} onBlur={handleBlur} min={0}>
            <NumberInputField placeholder="Min" textAlign="center" />
         </NumberInput>
         <Text>-</Text>
         <NumberInput size="sm" value={max} onChange={(val) => setMax(val)} onBlur={handleBlur} min={parseInt(min)}>
            <NumberInputField placeholder="Max" textAlign="center" />
         </NumberInput>
      </HStack>

      <Button w="100%" colorScheme={accentColor} leftIcon={<RepeatIcon />} onClick={handleSpin} isLoading={isSpinning}>
        Крутить
      </Button>
    </Box>
  );
};