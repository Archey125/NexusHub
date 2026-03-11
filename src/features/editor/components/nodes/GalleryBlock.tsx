/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeViewWrapper } from '@tiptap/react';
import { Box, Image, Button, IconButton, Flex, Text, Input, VStack, useColorModeValue } from '@chakra-ui/react';
import { DeleteIcon, AddIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useRef, useState } from 'react';
import { useCardStore } from '../../../../store/cardStore';
import { motion, AnimatePresence } from 'framer-motion'; //анимация перехода
import { SpoilerWrapper, SpoilerButton } from '../SpoilerWrapper';

// анимированный компонент картинки
const MotionImage = motion(Image);

export const GalleryBlock = (props: any) => {
  const { images } = props.node.attrs;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addFile = useCardStore((state) => state.addFile);
  const isEditable = props.editor.isEditable;

  const [currentIndex, setCurrentIndex] = useState(0);

  // цвета для подписи
  const captionColor = useColorModeValue('gray.600', 'gray.400');

  // обработчик изображения
  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);
    addFile(blobUrl, file); 

    const newImage = {
      id: Math.random().toString(36).substr(2, 9),
      src: blobUrl,
      caption: '',
      spoiler: false
    };

    const newImages = [...(images || []), newImage];
    props.updateAttributes({ images: newImages });
    setCurrentIndex(newImages.length - 1);
  };

  // удаление изображения
  const removeCurrentImage = () => {
    const newImages = images.filter((_: any, i: number) => i !== currentIndex);
    props.updateAttributes({ images: newImages });
    if (currentIndex >= newImages.length) setCurrentIndex(Math.max(0, newImages.length - 1));
  };

  // подписи
  const updateCaption = (text: string) => {
    const newImages = [...images];
    newImages[currentIndex] = { ...newImages[currentIndex], caption: text };
    props.updateAttributes({ images: newImages });
  };

  // спойлер
const toggleCurrentSpoiler = () => {
  const newImages = [...images];
  newImages[currentIndex] = { 
     ...newImages[currentIndex], 
     spoiler: !newImages[currentIndex].spoiler 
  };
  props.updateAttributes({ images: newImages });
};

  const currentImage = images && images[currentIndex];
  
  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <NodeViewWrapper className="react-component-gallery">
      <Box 
        my={6} 
        border={isEditable ? "1px dashed" : "none"} borderColor="gray.300" borderRadius="md"
        bg={isEditable ? "gray.50" : "transparent"} _dark={{ bg: isEditable ? 'gray.800' : 'transparent' }}
        p={isEditable ? 2 : 0}
      >
        {!images || images.length === 0 ? (
           <Flex direction="column" align="center" justify="center" p={8} gap={4}>
             <Text color="gray.500">Галерея пуста</Text>
             <Button leftIcon={<AddIcon />} onClick={() => fileInputRef.current?.click()}>
               Добавить фото
             </Button>
           </Flex>
        ) : (
           <VStack spacing={3}>
              {/* КОНТЕЙНЕР СЛАЙДЕРА */}
              <Box 
                position="relative" 
                w="100%" 
                display="flex" 
                justifyContent="center"
                bg="blackAlpha.50" _dark={{ bg: "blackAlpha.500" }}
                borderRadius="md" 
                overflow="hidden"
                minH="300px" // высота, чтобы не прыгало
              >
                <SpoilerWrapper 
                 key={currentImage.src} // сброс состояния при смене слайда
                 isSpoiler={currentImage.spoiler} 
                 isEditable={isEditable}
               >
                 {/* АНИМИРОВАННАЯ КАРТИНКА */}
                 <AnimatePresence mode='wait'>
                    <MotionImage
                      key={currentImage.src} // для перерисовки анимации
                      src={currentImage.src}
                      maxH="600px"
                      w="auto"
                      maxW="100%"
                      objectFit="contain"
                      // Параметры анимации
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                 </AnimatePresence>

                 </SpoilerWrapper>
                 
                 {/* НАВИГАЦИЯ */}
                 {images.length > 1 && (
                    <>
                      <IconButton 
                        aria-label="prev" icon={<ChevronLeftIcon boxSize={8} zIndex={12} />} 
                        position="absolute" left={2} top="50%" transform="translateY(-50%)" 
                        onClick={prev} variant="ghost" 
                        color="white" bg="blackAlpha.300" _hover={{ bg: 'blackAlpha.500' }} 
                        zIndex={2}
                      />
                      <IconButton 
                        aria-label="next" icon={<ChevronRightIcon boxSize={8} zIndex={12} />} 
                        position="absolute" right={2} top="50%" transform="translateY(-50%)" 
                        onClick={next} variant="ghost" 
                        color="white" bg="blackAlpha.300" _hover={{ bg: 'blackAlpha.500' }} 
                        zIndex={2}
                      />
                    </>
                 )}

                 {/* КНОПКИ УПРАВЛЕНИЯ */}
                 {isEditable && (
                    <Flex position="absolute" top={2} right={2} gap={2} zIndex={12}>
                       <Button size="xs" leftIcon={<AddIcon />} onClick={() => fileInputRef.current?.click()}>
                         Добавить
                       </Button>
                       <IconButton 
                         aria-label="del" icon={<DeleteIcon />} size="xs" colorScheme="red" 
                         onClick={removeCurrentImage} 
                       />
                       {/* Кнопка спойлера для текущего слайда */}
                       <SpoilerButton isSpoiler={currentImage.spoiler || false} onClick={toggleCurrentSpoiler} />
                    </Flex>
                 )}
                 
                 {/* СЧЕТЧИК */}
                 <Box position="absolute" top={2} left={2} bg="blackAlpha.600" px={2} py={1} borderRadius="md" zIndex={12}>
                    <Text fontSize="xs" color="white" fontWeight="bold">
                      {currentIndex + 1} / {images.length}
                    </Text>
                 </Box>
              </Box>

              {/* ПОДПИСЬ */}
              {(currentImage.caption || isEditable) && (
                 <Box w="100%" px={4}>
                   {isEditable ? (
                     <Input 
                       placeholder="Описание слайда..." 
                       value={currentImage.caption || ''} 
                       onChange={(e) => updateCaption(e.target.value)} 
                       textAlign="center" 
                       variant="flushed" 
                       size="sm"
                       color={captionColor}
                     />
                   ) : (
                     <Text color={captionColor} textAlign="center" fontSize="sm" fontStyle="italic">
                       {currentImage.caption}
                     </Text>
                   )}
                 </Box>
              )}
           </VStack>
        )}
        <input type="file" hidden ref={fileInputRef} onChange={handleAddImage} accept="image/*" />
      </Box>
    </NodeViewWrapper>
  );
};