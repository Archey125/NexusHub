/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Heading, Box, Button, Flex, Spinner, Text, Input, Textarea, 
  useToast, Image, Grid, GridItem, VStack, HStack, Switch, FormLabel, FormControl, AspectRatio, IconButton, Tooltip 
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon, AttachmentIcon, DeleteIcon } from '@chakra-ui/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';

// API
import { uploadFileToStorage, deleteFileFromStorage } from '../lib/storage'; // Cloudinary
import { useThemeStore } from '../store/themeStore';
import { getCardFull, updateCard, deleteCardRecord} from '../features/editor/api';

// TipTap
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { MenuBar } from '../features/editor/components/MenuBar';

export const CardEditor = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { accentColor } = useThemeStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const { data: card, isLoading } = useQuery({
    queryKey: ['card', cardId],
    queryFn: () => getCardFull(cardId!),
    enabled: !!cardId,
  });

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setCoverUrl(card.background_image || '');
    }
  }, [card]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Начните писать...' }),
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: '',
    editable: isEditMode,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  // загрузка контента в редактор (JSON)
  useEffect(() => {
    if (card?.content_json && editor && editor.isEmpty) {
       setTimeout(() => {
          editor.commands.setContent(card.content_json);
       }, 0);
    }
  }, [card, editor]);

  // синхронизация режима
  useEffect(() => {
    if (editor) editor.setEditable(isEditMode);
  }, [isEditMode, editor]);

  // сохранение данных
  const updateMutation = useMutation({
    mutationFn: updateCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      toast({ title: 'Сохранено', status: 'success' });
      setIsEditMode(false);
    }
  });

  const handleSave = () => {
    const contentJson = editor?.getJSON();

    const contentText = editor?.getText().slice(0, 200); 

    updateMutation.mutate({
      id: cardId!,
      updates: {
        title,
        description,
        background_image: coverUrl,
        content_json: contentJson,
        content_text: contentText, // текст для превью
        updated_at: new Date().toISOString()
      }
    });
  };

  const handleDeleteCard = async () => {
    if (!confirm('Удалить карточку навсегда?')) return;
    setIsUploading(true);
    try {
      // удаляем обложку (если есть)
      if (card.background_image) {
         await deleteFileFromStorage(card.background_image);
      }
      
      // TODO: в будущем будут файлы внутри текста, их тоже надо удалить

      // удаляем запись
      await deleteCardRecord(cardId!);
      
      toast({ title: 'Карточка удалена', status: 'info' });
      navigate(-1);
    } catch (e: any) {
      toast({ title: 'Ошибка удаления', description: e.message, status: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  // Обложка
  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      // Грузим новую
      const url = await uploadFileToStorage(file, 'covers');
      // Удаляем старую (если была)
      if (coverUrl) await deleteFileFromStorage(coverUrl);
      
      setCoverUrl(url);
      toast({ title: 'Обложка загружена', status: 'success' });
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e.message, status: 'error' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteCover = async () => {
    if (confirm('Удалить обложку?')) {
       setIsUploading(true);
       try {
          if (coverUrl) await deleteFileFromStorage(coverUrl);
          setCoverUrl('');
       } catch (e) { console.error(e); } 
       finally { setIsUploading(false); }
    }
  };

  if (isLoading) return <Flex h="100vh" align="center" justify="center"><Spinner size="xl" /></Flex>;
  if (!card) return <Box p={10}><Text>Карточка не найдена</Text></Box>;

  return (
    <Box maxW="container.lg" mx="auto" p={4} pb={20}>
      
      {/* Хедер */}
      <Flex mb={6} justify="space-between" align="center" position="sticky" top="64px" bg="rgba(255,255,255,0.8)" _dark={{ bg: 'rgba(26,32,44,0.8)' }} backdropFilter="blur(10px)" zIndex={10} py={2}>
        <Button leftIcon={<ArrowBackIcon />} variant="ghost" onClick={() => navigate(-1)}>Назад</Button>
        
        <HStack>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0" fontSize="sm" color="gray.500">{isEditMode ? 'Редактор' : 'Чтение'}</FormLabel>
              <Switch colorScheme={accentColor} isChecked={isEditMode} onChange={(e) => setIsEditMode(e.target.checked)} />
            </FormControl>
            
            {isEditMode && (
              <>
                <Tooltip label="Сохранить"><IconButton aria-label="save" icon={<CheckIcon />} colorScheme={accentColor} rounded="full" size="sm" onClick={handleSave} isLoading={updateMutation.isPending} /></Tooltip>
                <Tooltip label="Удалить"><IconButton aria-label="del" icon={<DeleteIcon />} colorScheme="red" variant="ghost" rounded="full" size="sm" onClick={handleDeleteCard} /></Tooltip>
              </>
            )}
        </HStack>
      </Flex>

      {/* Данные для карточки */}
      <Grid templateColumns={{ base: '1fr', md: '300px 1fr' }} gap={8} mb={10}>
        {/* Обложка */}
        <GridItem>
          <AspectRatio ratio={2 / 3} w="100%">
             <Box borderRadius="lg" overflow="hidden" border="1px solid" borderColor="gray.200" bg="gray.100" position="relative" role="group">
               {coverUrl ? (
                 <Image src={coverUrl} w="100%" h="100%" objectFit="cover" />
               ) : (
                 <Flex align="center" justify="center" h="100%" bg="gray.50" color="gray.400" flexDirection="column">
                    <Text>Нет обложки</Text>
                    {isEditMode && <Text fontSize="xs">(Вид заметки)</Text>}
                 </Flex>
               )}
               
               {isUploading && <Flex position="absolute" inset={0} bg="blackAlpha.600" align="center" justify="center"><Spinner color="white" /></Flex>}
               
               {isEditMode && !isUploading && (
                 <Flex position="absolute" inset={0} bg="blackAlpha.600" opacity={0} _groupHover={{ opacity: 1 }} transition="0.2s" align="center" justify="center" direction="column" gap={2}>
                   <Button size="sm" leftIcon={<AttachmentIcon />} onClick={() => fileInputRef.current?.click()}>
                     {coverUrl ? 'Заменить' : 'Загрузить'}
                   </Button>
                   {coverUrl && <Button size="sm" colorScheme="red" onClick={handleDeleteCover}>Удалить</Button>}
                 </Flex>
               )}
               <input type="file" hidden ref={fileInputRef} onChange={handleUploadCover} accept="image/*" />
             </Box>
          </AspectRatio>
        </GridItem>
        {/* Текст и название */}    
        <GridItem>
          <VStack align="stretch" spacing={4}>
            {isEditMode ? (
              <>
                <FormControl><FormLabel>Название</FormLabel><Input value={title} onChange={(e) => setTitle(e.target.value)} fontSize="2xl" fontWeight="bold" /></FormControl>
                <FormControl><FormLabel>Описание (на обороте)</FormLabel><Textarea value={description} onChange={(e) => setDescription(e.target.value)} h="200px" /></FormControl>
              </>
            ) : (
              <>
                <Heading size="2xl">{title}</Heading>
                {description && <Box p={4} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="md" borderLeft="4px solid" borderColor={`${accentColor}.500`}><Text fontStyle="italic" whiteSpace="pre-wrap">{description}</Text></Box>}
              </>
            )}
          </VStack>
        </GridItem>
      </Grid>

      {/* Редактор */}
      <Box mt={8}>
        {isEditMode && <MenuBar editor={editor} />}
        <Box 
          border={isEditMode ? '1px solid' : 'none'} borderColor="gray.200" borderRadius="md"
          className="tiptap-editor-container"
        >
          <EditorContent editor={editor} />
        </Box>
      </Box>

    </Box>
  );
};