/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeViewWrapper } from '@tiptap/react';
import { Box, Button, IconButton, Flex, Text, Select, VStack, Input } from '@chakra-ui/react';
import { DeleteIcon, AddIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getCardsByIds } from '../../api';
import { getCards } from '../../../cards/api';
import { CardItem } from '../../../cards/CardItem';
import { motion, AnimatePresence } from 'framer-motion';
import { SpoilerWrapper, SpoilerButton } from '../SpoilerWrapper';
// для списка категорий
import { supabase } from '../../../../lib/supabase';

export const CardCarouselBlock = (props: any) => {
  const { cardsData } = props.node.attrs;

  // массив ID для запроса к базе (игнорируем тех, у кого нет ID)
  const cardIds = cardsData?.map((c: any) => c.id).filter(Boolean) || [];

  const isEditable = props.editor.isEditable;
  const navigate = useNavigate();
  const { cardId } = useParams<{ cardId: string }>();

  const [isAdding, setIsAdding] = useState(false);
  const [selectedCat, setSelectedCat] = useState('');

  // данные карточки (Title, Image, Description)
  const { data: cards } = useQuery({
    queryKey: ['carousel-cards', cardIds],
    queryFn: () => getCardsByIds(cardIds),
    enabled: cardIds.length > 0,
    placeholderData: keepPreviousData,
  });

  // узнаем page_id текущей карточки для фильтра категорий
  const { data: pageId } = useQuery({
    queryKey: ['pageId-for-card', cardId],
    queryFn: async () => {
      // 1. Узнаем категорию карточки
      const cardRes = await supabase.from('cards').select('category_id').eq('id', cardId!).single();
      if (!cardRes.data) return null;
      // 2. Узнаем страницу категории
      const catRes = await supabase.from('categories').select('page_id').eq('id', cardRes.data.category_id).single();
      return catRes.data?.page_id || null;
    },
    enabled: !!cardId && isAdding // Запрашиваем только если открыли меню добавления
  });

  // категории карточек только текущей страницы
  const { data: categories } = useQuery({
    queryKey: ['categories-cards-page', pageId],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, title')
        .eq('page_id', pageId)
        .eq('content_type', 'cards');
      return data;
    },
    enabled: !!pageId && isAdding
  });

  // список карточек
  const { data: cardsToSelect } = useQuery({
    queryKey: ['cards-select', selectedCat],
    queryFn: () => getCards(selectedCat),
    enabled: !!selectedCat
  });

  // добавление карточек
  const handleAddCard = (id: string) => {
    // проверка на дубликаты
    if (cardsData?.some((c: any) => c.id === id)) return;

    const newCardData = { id, spoiler: false, caption: '' };
    const newCardsData = [...(cardsData || []), newCardData];

    props.updateAttributes({ cardsData: newCardsData });
    setIsAdding(false);
    setSelectedCat('');
  };

  // удаление карточек
  const removeCurrentCard = () => {
    const newCardsData = cardsData.filter((_: any, i: number) => i !== currentIndex);
    props.updateAttributes({ cardsData: newCardsData });
    // корректировка индекса после удаления
    if (currentIndex >= newCardsData.length) {
      setCurrentIndex(Math.max(0, newCardsData.length - 1));
    }
  };

  // спойдер карточки
  const toggleCurrentSpoiler = () => {
    const newCardsData = [...cardsData];
    newCardsData[currentIndex] = {
      ...newCardsData[currentIndex],
      spoiler: !newCardsData[currentIndex].spoiler
    };
    props.updateAttributes({ cardsData: newCardsData });
  };

  // обновление подписи текущей карточки
  const updateCurrentCaption = (text: string) => {
    const newCardsData = [...cardsData];
    newCardsData[currentIndex] = {
      ...newCardsData[currentIndex],
      caption: text
    };
    props.updateAttributes({ cardsData: newCardsData });
  };

  // карусель
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // данные текущей карточки
  const currentItemSettings = cardsData && cardsData[currentIndex];
  const currentCardContent = cards?.find((c: any) => c.id === currentItemSettings?.id);

  const next = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % cardsData.length);
  };

  const prev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + cardsData.length) % cardsData.length);
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 })
  };

  return (
    <NodeViewWrapper className="react-component-card-carousel">
      <Box
        my={6} p={2} border={isEditable ? "1px dashed" : "none"} borderColor="gray.300" borderRadius="md"
        bg={isEditable ? "gray.50" : "transparent"} _dark={{ bg: isEditable ? 'gray.800' : 'transparent' }}
      >
        {isAdding ? (
          <VStack p={4} spacing={3} bg="white" _dark={{ bg: 'gray.700' }} borderRadius="md" boxShadow="sm">
            <Text fontWeight="bold">Добавить связь</Text>
            <Select placeholder="Категория" onChange={(e) => setSelectedCat(e.target.value)}>
              {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
            {selectedCat && (
              <Select placeholder="Карточка" onChange={(e) => handleAddCard(e.target.value)}>
                {cardsToSelect?.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </Select>
            )}
            <Button size="sm" onClick={() => setIsAdding(false)}>Отмена</Button>
          </VStack>
        ) : (
          <>
            {!cardsData || cardsData.length === 0 ? (
              <Flex direction="column" align="center" p={8} gap={4}>
                <Text color="gray.500">Нет связей</Text>
                {isEditable && <Button leftIcon={<AddIcon />} onClick={() => setIsAdding(true)}>Добавить</Button>}
              </Flex>
            ) : (
              <Flex align="center" gap={4} justify="center" position="relative" minH="320px">

                {/* КОНТЕЙНЕР КАРТОЧКИ */}
                <Box w={{ base: "100%", sm: "350px" }} position="relative">

                  {/* СТРЕЛКИ */}
                  {cardsData.length > 1 && (
                    <>
                      <IconButton
                        aria-label="prev" icon={<ChevronLeftIcon boxSize={8} />}
                        position="absolute" left={{ base: 0, sm: -50 }} top="50%" transform="translateY(-50%)"
                        onClick={prev} variant="ghost" color="white" bg="blackAlpha.300" _hover={{ bg: 'blackAlpha.500' }}
                        zIndex={15}
                      />
                      <IconButton
                        aria-label="next" icon={<ChevronRightIcon boxSize={8} />}
                        position="absolute" right={{ base: 0, sm: -50 }} top="50%" transform="translateY(-50%)"
                        onClick={next} variant="ghost" color="white" bg="blackAlpha.300" _hover={{ bg: 'blackAlpha.500' }}
                        zIndex={15}
                      />
                    </>
                  )}

                  {/* КАРТОЧКА */}
                  <SpoilerWrapper
                    key={currentItemSettings?.id} // пересоздаем wrapper при смене слайда
                    isSpoiler={currentItemSettings?.spoiler || false}
                    isEditable={isEditable}
                  >
                    <AnimatePresence mode='wait' custom={direction}>
                      {currentCardContent && (
                        <motion.div
                          key={currentCardContent.id}
                          custom={direction}
                          variants={variants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.2 }}
                          style={{ width: '100%' }}
                        >
                          <CardItem
                            card={currentCardContent}
                            onClick={() => {
                              if (!isEditable) {
                                navigate(`/card/${currentCardContent.id}`);
                                window.scrollTo(0, 0);
                              }
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SpoilerWrapper>

                  {/* КНОПКИ УПРАВЛЕНИЯ (EDIT MODE) */}
                  {isEditable && (
                    <Flex position="absolute" top={2} right={2} gap={2} zIndex={20} bg="blackAlpha.600" p={1} borderRadius="md">
                      {/* Спойлер */}
                      <SpoilerButton
                        isSpoiler={currentItemSettings?.spoiler || false}
                        onClick={toggleCurrentSpoiler}
                      />
                      {/* Удаление */}
                      <IconButton
                        aria-label="del" icon={<DeleteIcon />} size="sm" colorScheme="red"
                        onClick={(e) => { e.stopPropagation(); removeCurrentCard(); }}
                      />
                    </Flex>
                  )}
                </Box>

              </Flex>
            )}

            {isEditable && cardsData && cardsData.length > 0 && (
              <Flex justify="center" mt={4}>
                <Button size="xs" leftIcon={<AddIcon />} onClick={() => setIsAdding(true)}>Добавить еще</Button>
              </Flex>
            )}

            {/* поле подписи карточки */}
            {(cardsData?.length > 0 && currentItemSettings) && (
              <Box w="100%" px={4} mt={4}>
                {isEditable ? (
                  <Input
                    placeholder="Подпись к этой карточке..."
                    value={currentItemSettings.caption || ''}
                    onChange={(e) => updateCurrentCaption(e.target.value)}
                    textAlign="center"
                    variant="flushed"
                    size="sm"
                  />
                ) : (
                  currentItemSettings.caption && (
                    <Text color="gray.400" textAlign="center" fontSize="md" fontStyle="italic">
                      {currentItemSettings.caption}
                    </Text>
                  )
                )}
              </Box>
            )}

          </>
        )}
      </Box>
    </NodeViewWrapper>
  );
};