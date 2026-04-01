/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Button, Input, Spinner, SimpleGrid, HStack, VStack, IconButton, Flex, Text, Select } from '@chakra-ui/react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useThemeStore } from '../../store/themeStore';
import { getCards, createCard, updateCardsOrder } from '../../features/cards/api';
import { CardItem } from '../../features/cards/CardItem';
import { supabase } from '../../lib/supabase'; // Прямой запрос для фильтров

// DnD
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../common/SortableItem';

export const CategoryCards = ({ id }: { id: string }) => {
  const { accentColor } = useThemeStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // для поиска и фильтра карт
  const { pageId } = useParams<{ pageId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterCardId, setFilterCardId] = useState('');

  // загрузка карт
  const { data: serverCards, isLoading } = useQuery({ queryKey: ['cards', id], queryFn: () => getCards(id) });

  // загрузка категорий для фильтра
  const { data: categoriesForFilter } = useQuery({
     queryKey: ['categories-filter', pageId],
     queryFn: async () => (await supabase
        .from('categories')
        .select('id, title')
        .eq('page_id', pageId!) // фильтр по странице
        .eq('content_type', 'cards')
     ).data,
     enabled: !!pageId
  });

  // загрузка Карточек для фильтра (при выбанной категории)
  const { data: cardsForFilter } = useQuery({
    queryKey: ['cards-filter-list', filterCategoryId],
    queryFn: async () => (await supabase.from('cards').select('id, title').eq('category_id', filterCategoryId)).data,
    enabled: !!filterCategoryId
  });

  // DnD
  const [cards, setCards] = useState<any[]>([]);
  useEffect(() => {
    if (serverCards) {
      const timeout = setTimeout(() => {
        setCards(prev => JSON.stringify(prev) === JSON.stringify(serverCards) ? prev : serverCards);
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [serverCards]);

  // мутации
  const createMutation = useMutation({
    mutationFn: () => createCard(id, newTitle),
    onSuccess: (newCard) => {
      queryClient.invalidateQueries({ queryKey: ['cards', id] });
      setNewTitle(''); setIsAdding(false);
      navigate(`/card/${newCard.id}`);
    }
  });

  const reorderMutation = useMutation({ mutationFn: updateCardsOrder });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = cards.findIndex(c => c.id === active.id);
    const newIndex = cards.findIndex(c => c.id === over.id);
    const newOrder = arrayMove(cards, oldIndex, newIndex);
    setCards(newOrder);
    reorderMutation.mutate(newOrder.map((c, i) => ({ id: c.id, sort_order: i })));
  };

  // фильтрация для поиска
  const filteredCards = cards.filter(c => {
    // текст
    const matchText = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.content_text?.toLowerCase().includes(searchQuery.toLowerCase());

    // связи
    let matchLink = true;
    if (filterCardId) {
      matchLink = c.linked_card_ids?.includes(filterCardId) || false;
    }

    return matchText && matchLink;
  });

  const isFiltering = !!searchQuery || !!filterCardId;

  if (isLoading) return <Spinner />;

  return (
    <Box>
      {/* ПАНЕЛЬ УПРАВЛЕНИЯ */}
      <Flex mb={6} gap={2} wrap="wrap" width="100%" justify="space-between">
        {!isAdding ? (
          <Button
            leftIcon={<AddIcon />}
            mb={4}
            colorScheme={accentColor}
            onClick={() => setIsAdding(true)}
            width={{ base: "100%", md: "200px" }}
          >
            Добавить карточку
          </Button>
        ) : (
          <HStack align="stretch" w={{ base: '100%', md: 'auto' }} spacing={3}>
            <Input
              placeholder="Название..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              width={{ base: "100%", md: "300px" }}
            />
            <Button colorScheme={accentColor} onClick={() => newTitle && createMutation.mutate()}>OK</Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>X</Button>
          </HStack>
        )}

        <Text textAlign="center" w={{base:"100%",md:"auto"}} fontSize="lg" color={`${accentColor}.500`}>Найдено: {filteredCards.length}</Text>

        {/* ФИЛЬТРЫ И ПОИСК */}
        {!isAdding && (
          <VStack align="flex-end" spacing={2}>
            <Flex align="stretch" wrap="wrap" gap={2} justify="flex-end" w="100%">
              {/* Поиск */}
              <Input
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                width={{ base: "100%", md: "300px" }}
              />
              {searchQuery && <IconButton aria-label="clear" icon={<CloseIcon />} size="sm" onClick={() => setSearchQuery('')} />}

              {/* Выбор Категории Фильтра */}
              <Select
                placeholder="Фильтр: Категория"
                width={{ base: "100%", md: "300px" }}
                value={filterCategoryId}
                onChange={(e) => { setFilterCategoryId(e.target.value); setFilterCardId(''); }}
              >
                {categoriesForFilter?.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </Select>

              {/* Выбор Карточки Фильтра */}
              {filterCategoryId && (
                <Select
                  placeholder="Фильтр: Карточка"
                  width={{ base: "100%", md: "300px" }}
                  value={filterCardId}
                  onChange={(e) => setFilterCardId(e.target.value)}
                >
                  {cardsForFilter?.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </Select>
              )}

              {(searchQuery || filterCategoryId) && (
                <IconButton aria-label="clear" icon={<CloseIcon />} onClick={() => { setSearchQuery(''); setFilterCategoryId(''); setFilterCardId(''); }} />
              )}
            </Flex>
          </VStack>

        )}
      </Flex>

      {isFiltering ? (
        // в поиске отключаем dnd
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 5 }} spacing={4}>
          {filteredCards.map(card => (
            <CardItem
              key={card.id} card={card}
              onClick={() => navigate(`/card/${card.id}`)}
            />
          ))}
        </SimpleGrid>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={cards.map(c => c.id)} strategy={rectSortingStrategy}>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 5 }} spacing={4} pb={4}>
              {cards.map(card => (
                <SortableItem key={card.id} id={card.id}>
                  <CardItem
                    card={card}
                    onClick={() => navigate(`/card/${card.id}`)}
                  />
                </SortableItem>
              ))}
            </SimpleGrid>
          </SortableContext>
        </DndContext>
      )}

      {filteredCards.length === 0 && <Text color={`${accentColor}.500`} textAlign="center" mt={10}>Ничего не найдено</Text>}
    </Box>
  );
};