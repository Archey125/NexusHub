import { 
  Box, Button, Input, SimpleGrid, useToast, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, VStack, FormControl, FormLabel, Spinner,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { getLinks, createLink, updateLinksOrder, updateLink, deleteLink } from '../../features/browser/api';
import type { LinkItem } from '../../features/browser/api';

// DND
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../common/SortableItem';

// компонент ссылок
import { LinkCard } from '../../features/browser/LinkCard';
import { AddLink } from '../../features/browser/AddLink';

export const CategoryLinks = ({ id }: { id: string }) => {
  const { accentColor } = useThemeStore();
  const toast = useToast();
  const queryClient = useQueryClient();

  // для модалки
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null); // если null - создание, иначе - редактирование
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  // грузим ссылки
  const { data: serverLinks, isLoading } = useQuery({ 
    queryKey: ['links', id], 
    queryFn: () => getLinks(id) 
  });

  // стейт для DnD
  const [links, setLinks] = useState<LinkItem[]>([]);
  useEffect(() => {
    if (serverLinks) {

      const timeoutId = setTimeout(() => {
        setLinks((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(serverLinks)) return prev;
          return serverLinks;
        });
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [serverLinks]);

  // мутации
  const createMutation = useMutation({
    mutationFn: () => createLink(id, title, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', id] });
      onClose();
      toast({ title: 'Ссылка добавлена', status: 'success' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: () => updateLink(editingLink!.id, title, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', id] });
      onClose();
      toast({ title: 'Ссылка обновлена', status: 'success' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLink,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['links', id] })
  });

  const reorderMutation = useMutation({ mutationFn: updateLinksOrder });

  // хендлеры
  const handleOpenCreate = () => {
    setEditingLink(null);
    setTitle('');
    setUrl('');
    onOpen();
  };

  const handleOpenEdit = (link: LinkItem) => {
    setEditingLink(link);
    setTitle(link.title);
    setUrl(link.url);
    onOpen();
  };

  const handleSubmit = () => {
    if (!title || !url) return;
    if (editingLink) updateMutation.mutate();
    else createMutation.mutate();
  };

  // DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex(l => l.id === active.id);
    const newIndex = links.findIndex(l => l.id === over.id);
    const newOrder = arrayMove(links, oldIndex, newIndex);
    setLinks(newOrder);
    reorderMutation.mutate(newOrder.map((l, i) => ({ id: l.id, sort_order: i })));
  };

  if (isLoading) return <Spinner />;

  return (
    <Box>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={links.map(l => l.id)} strategy={rectSortingStrategy}>
           <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 6 }} spacing={4}>
              {/* Список ссылок */}
              {links.map(link => (
                 <SortableItem key={link.id} id={link.id}>
                    <LinkCard 
                      link={link} 
                      onDelete={() => deleteMutation.mutate(link.id)}
                      onEdit={() => handleOpenEdit(link)} 
                      isHome={false}
                    />
                 </SortableItem>
              ))}
              {/* Кнопка-плитка "Добавить" */}
              <AddLink handleOpenCreate={handleOpenCreate}/>
           </SimpleGrid>
        </SortableContext>
      </DndContext>

      {/* Модалка */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingLink ? 'Редактировать ссылку' : 'Новая ссылка'}</ModalHeader>
          <ModalBody>
             <VStack spacing={4}>
                <FormControl>
                   <FormLabel>Название</FormLabel>
                   <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
                </FormControl>
                <FormControl>
                   <FormLabel>URL</FormLabel>
                   <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
                </FormControl>
             </VStack>
          </ModalBody>
          <ModalFooter>
             <Button variant="ghost" mr={3} onClick={onClose}>Отмена</Button>
             <Button colorScheme={accentColor} onClick={handleSubmit} isLoading={createMutation.isPending || updateMutation.isPending}>
               Сохранить
             </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
