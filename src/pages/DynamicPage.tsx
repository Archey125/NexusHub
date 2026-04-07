/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Button, Container, Flex, Heading, IconButton, Spinner, Text, useDisclosure, 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Select, VStack,
} from '@chakra-ui/react';
import { AddIcon, SettingsIcon, EditIcon } from '@chakra-ui/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import { SortableCategoryItem } from '../components/dynamic/SortableCategoryItem';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { useThemeStore } from '../store/themeStore';
import { motion } from 'framer-motion';
import { 
  getPages, updatePage, deletePage, 
  getCategories, createCategory, deleteCategory, updateCategory, reorderCategories 
} from '../features/core/api';

// Типы категорий
import { CategoryLinks } from '../components/dynamic/CategoryLinks';
import { CategoryGen } from '../components/dynamic/CategoryGen';
import { CategoryAudio } from '../components/dynamic/CategoryAudio';
import { CategoryCards } from '../components/dynamic/CategoryCards';

const CONTENT_TYPES = [
  { value: 'links', label: 'Ссылки' },
  { value: 'cards', label: 'Карточки' },
  { value: 'audio', label: 'Аудио' },
  { value: 'generators', label: 'Генераторы' },
];

const slideVariants = {
   hidden: { opacity: 0, y: -20 },
   visible: { opacity: 1, y: 0, transition: { duration: 1.5 } }
};

export const DynamicPage = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accentColor } = useThemeStore();

  // сохранение открытой категории
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCatId = searchParams.get('category');

  const handleCategoryClick = (id: string) => {
    setSearchParams({ category: id });
  };

  //МОДАЛКИ

  // для страниц
  const { isOpen: isPageSettingsOpen, onOpen: onPageSettingsOpen, onClose: onPageSettingsClose } = useDisclosure();
  const [pageTitleEdit, setPageTitleEdit] = useState('');

  // для категорий (создание)
  const { isOpen: isCatAddOpen, onOpen: onCatAddOpen, onClose: onCatAddClose } = useDisclosure();
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatType, setNewCatType] = useState('links');

  // для категорий (редактирование)
  const { isOpen: isCatEditOpen, onOpen: onCatEditOpen, onClose: onCatEditClose } = useDisclosure();
  const [editCatTitle, setEditCatTitle] = useState('');

  // дата и загрузка
  const { data: pages } = useQuery({ queryKey: ['pages'], queryFn: getPages });
  const currentPage = pages?.find(p => p.id === pageId);

  const { data: serverCategories, isLoading } = useQuery({
    queryKey: ['categories', pageId],
    queryFn: () => getCategories(pageId!),
    enabled: !!pageId
  });

  // стейт категорий для DnD
  const [categories, setCategories] = useState<any[]>([]);
  useEffect(() => {
    if (serverCategories) {
      const timeout = setTimeout(() => {
        setCategories(serverCategories);
        if (!selectedCatId && serverCategories.length > 0) {
          setSearchParams({ category: serverCategories[0].id }, { replace: true });
        }
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [serverCategories, selectedCatId, setSearchParams]);

  const activeCategory = categories.find(c => c.id === selectedCatId);

  // Мутации для DnD
  const updatePageMutation = useMutation({
    mutationFn: (title: string) => updatePage(pageId!, { title }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pages'] }); onPageSettingsClose(); }
  });

  const deletePageMutation = useMutation({
    mutationFn: () => deletePage(pageId!),
    onSuccess: () => navigate('/'),
    onError: (e: any) => alert(e.message)
  });

  const createCatMutation = useMutation({
    mutationFn: () => createCategory(pageId!, newCatTitle, newCatType),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories', pageId] });
      setNewCatTitle(''); onCatAddClose();
      handleCategoryClick(data.id);
    }
  });

  const updateCatMutation = useMutation({
    mutationFn: (title: string) => updateCategory(selectedCatId!, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', pageId] });
      onCatEditClose();
    }
  });

  const deleteCatMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', pageId] });
      setSearchParams({});
    },
    onError: (e: any) => alert(e.message)
  });

  const reorderMutation = useMutation({ mutationFn: reorderCategories });

  // DND
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex(c => c.id === active.id);
    const newIndex = categories.findIndex(c => c.id === over.id);
    const newOrder = arrayMove(categories, oldIndex, newIndex);
    setCategories(newOrder);
    reorderMutation.mutate(newOrder.map((c, i) => ({ id: c.id, sort_order: i })));
  };

  if (isLoading) return <Flex h="50vh" justify="center" align="center"><Spinner size="xl" /></Flex>;
  if (!currentPage && pages) return <Text p={10}>Страница не найдена</Text>;

  return (
    <motion.div initial="hidden" animate="visible" variants={slideVariants}>
      <Container maxW="container.2xl" py={6} px={6} display="flex" flexDirection="column">
        
        {/* Хедер */}
        <Flex justify="space-between" align="center" mb={6}>
          <Heading color={`${accentColor}.400`}>{currentPage?.title}</Heading>
          <IconButton aria-label="Settings" icon={<SettingsIcon />} size="sm" variant="ghost" onClick={() => { setPageTitleEdit(currentPage?.title || ''); onPageSettingsOpen(); }} />
        </Flex>

        <Flex gap={6} flex={1} overflow="hidden" alignItems="flex-start" direction={{ base: 'column', md: 'row' }}>
          
          {/* Категории */}
          <Box 
            w={{ base: '100%', md: '280px' }} 
            flexShrink={0} 
            display="flex" 
            flexDirection="column"
            borderRight={{ base: 'none', md: '1px solid' }} 
            borderColor="gray.200"
            pr={{ base: 0, md: 4 }}
          >
            {/* Категории мобилки */}
            <Box display={{ base: 'block', md: 'none' }} mb={4}>
              <Select value={selectedCatId || ''} onChange={(e) => handleCategoryClick(e.target.value)}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </Select>
              <Button size="sm" w="100%" mt={2} leftIcon={<AddIcon />} onClick={onCatAddOpen}>Новая категория</Button>
            </Box>

            {/* Категории десктоп */}
            <Box display={{ base: 'none', md: 'flex' }} flexDirection="column" flex={1} overflowY="auto">
              <Button leftIcon={<AddIcon />} mb={4} onClick={onCatAddOpen} colorScheme={accentColor} variant="outline">
                Новая категория
              </Button>
              
              {/* DND список */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <VStack spacing={1} align="stretch" overflow="hidden" height="100%">
                      {categories.map(cat => (
                          <SortableCategoryItem 
                            key={cat.id} 
                            id={cat.id} 
                            title={cat.title}
                            isSelected={selectedCatId === cat.id}
                            onClick={() => handleCategoryClick(cat.id)}
                            accentColor={accentColor}
                          />
                      ))}
                    </VStack>
                </SortableContext>
              </DndContext>
            </Box>
          </Box>

          {/* Контент категории */}
          <Box flex={1} pl={{ base: 0, md: 4 }} p={4} w="100%">
            {activeCategory ? (
                <>
                  <Flex justify="space-between" align="center" mb={6} borderBottom="1px solid" borderColor="gray.200" pb={2}>
                      <Heading size="md" color={`${accentColor}.400`}>{activeCategory.title}</Heading>
                      <IconButton 
                        aria-label="edit" icon={<EditIcon />} size="xs" variant="ghost" 
                        onClick={() => { setEditCatTitle(activeCategory.title); onCatEditOpen(); }} 
                      />
                  </Flex>

                  {/* рендер контента по типу */}
                  {activeCategory.content_type === 'links' && <CategoryLinks id={activeCategory.id} />}
                  {activeCategory.content_type === 'cards' && <CategoryCards id={activeCategory.id} />}
                  {activeCategory.content_type === 'audio' && <CategoryAudio id={activeCategory.id} />}
                  {activeCategory.content_type === 'generators' && <CategoryGen id={activeCategory.id} />}
                </>
            ) : (
                <Flex h="100%" align="center" justify="center" color="gray.500">
                  Выберите или создайте категорию
                </Flex>
            )}
          </Box>

        </Flex>

        {/* Модалки */}
        
        {/* Настройки страницы */}
        <Modal isOpen={isPageSettingsOpen} onClose={onPageSettingsClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Настройки страницы</ModalHeader>
            <ModalBody>
                <Input
                  placeholder="Название" 
                  value={pageTitleEdit} 
                  onChange={(e) => setPageTitleEdit(e.target.value)}
                  autoFocus 
                />
            </ModalBody>
            <ModalFooter justifyContent={"space-between"}>
              <Button colorScheme="red" variant="outline" onClick={() => { if(confirm('Удалить страницу?')) deletePageMutation.mutate(); }}>
                Удалить страницу
              </Button>
              <Button colorScheme={accentColor} onClick={() => updatePageMutation.mutate(pageTitleEdit)}>Сохранить</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Создание категории */}
        <Modal isOpen={isCatAddOpen} onClose={onCatAddClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Новая категория</ModalHeader>
            <ModalBody>
              <VStack spacing={4}>
                  <Input placeholder="Название (напр. Избранное)" value={newCatTitle} onChange={(e) => setNewCatTitle(e.target.value)} autoFocus />
                  <Select value={newCatType} onChange={(e) => setNewCatType(e.target.value)}>
                    {CONTENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme={accentColor} onClick={() => newCatTitle && createCatMutation.mutate()}>Создать</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>


        {/* Редактирование категории */}
        <Modal isOpen={isCatEditOpen} onClose={onCatEditClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Редактировать категорию</ModalHeader>
            <ModalBody>
              <Input
                placeholder="Название" 
                value={editCatTitle} 
                onChange={(e) => setEditCatTitle(e.target.value)} 
                autoFocus 
              />
            </ModalBody>
            <ModalFooter justifyContent={"space-between"}>
              <Button mr={3} onClick={onCatEditClose}>Отмена</Button>
              <Button 
                colorScheme={accentColor} 
                onClick={() => editCatTitle && updateCatMutation.mutate(editCatTitle)}
                isLoading={updateCatMutation.isPending}
              >
                Сохранить
              </Button>
              <Button 
                colorScheme="red" variant="outline"
                onClick={() => { if(confirm('Удалить категорию?')) deleteCatMutation.mutate(activeCategory.id); }}
                isLoading={updateCatMutation.isPending}
              >
                Удалить
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

      </Container>
    </motion.div>  
  );
};