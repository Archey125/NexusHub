import { Box, Text, Image, AspectRatio, useColorModeValue, Heading, Flex, } from '@chakra-ui/react';
import { useState } from 'react';
import { type Card } from './api';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  card: Card;
  onClick: () => void;
}

export const CardItem = ({ card, onClick }: Props) => {
  const { accentColor } = useThemeStore();
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Цвета
  const bgBack = useColorModeValue('white', 'gray.800');
  const noteBg = useColorModeValue('yellow.50', 'gray.700'); //для заметки

  // для очистки HTML тегов из превью
  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html || "";
    return tmp.textContent || tmp.innerText || "";
  };

  // Карточка заметка
  if (!card.background_image) {
    return (
      <AspectRatio ratio={2 / 3} w="100%">
        <Box 
          onClick={onClick} cursor="pointer" position="relative" role="group"
          bg={noteBg} borderRadius="xl" border="1px solid" borderColor={`${accentColor}.600`}
          boxShadow="sm" _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
          transition="all 0.2s" overflow="hidden" p={4}
        >
           <Flex direction="column" h="100%">
              <Heading size="md" mb={2} color={`${accentColor}.600`} _dark={{ color: `${accentColor}.500` }}>
                 {card.title}
              </Heading>
              <Box flex={1} overflow="hidden">
                 <Text fontSize="sm" color={`${accentColor}.300`} noOfLines={10} whiteSpace="pre-wrap">
                    {stripHtml(card.content_text || card.description || "")}
                 </Text>
              </Box>
           </Flex>
        </Box>
      </AspectRatio>
    );
  }

  // Карточка с обложкой
  return (
    <AspectRatio ratio={2 / 3} w="100%">
      <Box
        cursor="pointer" position="relative"
        onMouseEnter={() => setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
        onClick={onClick}
      >
        <Box
          w="100%" h="100%" transition="transform 0.6s" position="relative" borderRadius="xl" boxShadow="lg"
          sx={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Передняя часть */}
          <Box
            position="absolute" inset={0} borderRadius="xl" overflow="hidden" bg="gray.800"
            border="1px solid" borderColor={`${accentColor}.600`} sx={{ backfaceVisibility: 'hidden' }}
          >
            <Image src={card.background_image} w="100%" h="100%" objectFit="cover" />
            
            {/* Название карточки */}
            <Box
              position="absolute" bottom={0} left={0} right={0}
              bg="rgba(20, 20, 20, 0.95)" pt={8} pb={4} px={4}
              clipPath="polygon(0 25px, 100% 0, 100% 100%, 0% 100%)"
              display="flex" flexDirection="column" alignItems="flex-end"
            >
              <Text fontWeight="bold" fontSize="lg" noOfLines={2} lineHeight="1.2" color={`${accentColor}.500`} textAlign="right" w="100%">
                {card.title}
              </Text>
            </Box>
          </Box>

          {/* Задний текст */}
          <Box
            position="absolute" inset={0} bg={bgBack} borderRadius="xl" p={6}
            border="2px solid" borderColor={`${accentColor}.500`}
            display="flex" alignItems="center" justifyContent="center" textAlign="center"
            sx={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <Text fontSize="md" color={`${accentColor}.300`} noOfLines={10}>
              {card.description || "Нет описания..."}
            </Text>
          </Box>
        </Box>
      </Box>
    </AspectRatio>
  );
};