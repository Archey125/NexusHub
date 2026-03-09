/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Button, Input, Spinner, SimpleGrid, HStack } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../store/themeStore';
import { getCards, createCard, updateCardsOrder } from '../../features/cards/api';
import { CardItem } from '../../features/cards/CardItem';

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

  const { data: serverCards, isLoading } = useQuery({ queryKey: ['cards', id], queryFn: () => getCards(id) });

  const [cards, setCards] = useState<any[]>([]);
  useEffect(() => {
    if (serverCards) {
        const timeout = setTimeout(() => {
            setCards(prev => JSON.stringify(prev) === JSON.stringify(serverCards) ? prev : serverCards);
        }, 0);
        return () => clearTimeout(timeout);
    }
  }, [serverCards]);

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

  if (isLoading) return <Spinner />;

  return (
    <Box>
      {!isAdding ? (
         <Button leftIcon={<AddIcon />} mb={4} colorScheme={accentColor} onClick={() => setIsAdding(true)}>Добавить карточку</Button>
      ) : (
         <HStack mb={4}>
            <Input placeholder="Название..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
            <Button colorScheme={accentColor} onClick={() => newTitle && createMutation.mutate()}>OK</Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>X</Button>
         </HStack>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cards.map(c => c.id)} strategy={rectSortingStrategy}>
           <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 5 }} spacing={4} overflow="hidden">
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
    </Box>
  );
};