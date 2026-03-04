/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  Box, Button, Input, Spinner, SimpleGrid, useToast, HStack, Select 
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

// API и типы
import { createGenerator, getGenerators, updateGeneratorsOrder } from '../../features/generators/api';
import { GeneratorCard } from '../../features/generators/GeneratorCard';
import { NumberGeneratorCard } from '../../features/generators/NumberGeneratorCard';

// DnD
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../common/SortableItem';

export const CategoryGen = ({ id }: { id: string }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'custom' | 'number'>('custom');
  const [isAdding, setIsAdding] = useState(false);

  // 1. Грузим генераторы
  const { data: serverGenerators, isLoading } = useQuery({ 
    queryKey: ['generators', id], 
    queryFn: () => getGenerators(id) 
  });

  // 2. Локальный стейт (с фиксом useEffect)
  const [generators, setGenerators] = useState<any[]>([]);
  
  useEffect(() => {
    if (serverGenerators) {
      const timeout = setTimeout(() => {
         setGenerators(prev => JSON.stringify(prev) === JSON.stringify(serverGenerators) ? prev : serverGenerators);
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [serverGenerators]);

  // 3. Мутации
  const createMutation = useMutation({
    mutationFn: () => createGenerator(id, newTitle, newType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generators', id] });
      setNewTitle(''); setIsAdding(false);
      toast({ title: 'Генератор создан', status: 'success' });
    }
  });

  const reorderMutation = useMutation({ mutationFn: updateGeneratorsOrder });

  // 4. DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = generators.findIndex(g => g.id === active.id);
    const newIndex = generators.findIndex(g => g.id === over.id);
    
    const newOrder = arrayMove(generators, oldIndex, newIndex);
    setGenerators(newOrder);
    
    reorderMutation.mutate(newOrder.map((g, i) => ({ id: g.id, sort_order: i })));
  };

  if (isLoading) return <Spinner />;

  return (
    <Box>
      {/* МЕНЮ ДОБАВЛЕНИЯ */}
      {!isAdding ? (
          <Button leftIcon={<AddIcon />} mb={4} onClick={() => setIsAdding(true)} size="sm">
            Добавить генератор
          </Button>
      ) : (
          <HStack mb={4}>
            <Select w="110px" value={newType} onChange={(e) => setNewType(e.target.value as any)} size="sm">
                <option value="custom">Список</option>
                <option value="number">Числа</option>
            </Select>
            <Input placeholder="Название" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus size="sm" />
            <Button size="sm" onClick={() => createMutation.mutate()}>OK</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>X</Button>
          </HStack>
      )}

      {/* СЕТКА */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={generators.map(g => g.id)} strategy={rectSortingStrategy}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {generators.map(gen => (
                <SortableItem key={gen.id} id={gen.id}>
                    {/* Обертка Box не нужна, если кнопки управления внутри карточки */}
                    {gen.type === 'number' 
                      ? <NumberGeneratorCard generator={gen} />
                      : <GeneratorCard generator={gen} />
                    }
                </SortableItem>
              ))}
          </SimpleGrid>
        </SortableContext>
      </DndContext>
    </Box>
  );
};