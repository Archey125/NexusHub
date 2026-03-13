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
import { deleteFileFromStorage } from '../lib/storage'; // Cloudinary
import { useThemeStore } from '../store/themeStore';
import { getCardFull, updateCard, uploadCardCover, deleteCardRecord} from '../features/editor/api';
import { extractFileUrls, processContentAndUpload } from '../features/editor/utils';
import { useCardStore } from '../store/cardStore';

// TipTap
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { MenuBar } from '../features/editor/components/MenuBar';
import { SpoilerMark } from '../features/editor/extensions/SpoilerMark';

//Медиа блоки
import { ImageNode } from '../features/editor/extensions/ImageNode';
import { GalleryNode } from '../features/editor/extensions/GalleryNode';
import { VideoNode } from '../features/editor/extensions/VideoNode';
import { AudioNode } from '../features/editor/extensions/AudioNode';
import { CardCarouselNode } from '../features/editor/extensions/CardCarouselNode';

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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Начните писать...' }),
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      Link.configure({ openOnClick: false, autolink: true }),
      SpoilerMark,
      ImageNode,
      GalleryNode,
      VideoNode,
      AudioNode,
      CardCarouselNode,
    ],
    content: '',
    editable: isEditMode,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  // заполнение метаданных при загрузке
  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setCoverUrl(card.background_image || '');
    }
  }, [card]);

  // обработчик клика по спойлеру
  useEffect(() => {
    const handleSpoilerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('spoiler-blur')) {
        target.classList.remove('spoiler-blur');
        target.classList.add('spoiler-visible');
      } else if (target.classList.contains('spoiler-visible')) {
         target.classList.add('spoiler-blur');
         target.classList.remove('spoiler-visible');
      }
    };

    document.addEventListener('click', handleSpoilerClick);
    return () => document.removeEventListener('click', handleSpoilerClick);
  }, []);

  // стили ссылок под акцент
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .ProseMirror a {
        color: var(--chakra-colors-${accentColor}-500) !important;
        text-decoration: underline;
        text-underline-offset: 3px;
      }
      .ProseMirror a:hover {
        background-color: var(--chakra-colors-${accentColor}-50);
        color: var(--chakra-colors-${accentColor}-600) !important;
      }
      [data-theme='dark'] .ProseMirror a:hover {
        background-color: var(--chakra-colors-${accentColor}-900);
        color: var(--chakra-colors-${accentColor}-200) !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [accentColor]);

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

  const handleSave = async () => {
    setIsUploading(true);
    try {
      let contentJson = editor?.getJSON();
      
      // загрузка файлов blob
      if (contentJson) {
         contentJson = await processContentAndUpload(contentJson, cardId!); //ID для папки
      }

      // очистка старых файлов
      const oldContent = card?.content_json;
      const oldFiles = extractFileUrls(oldContent);
      const newFiles = extractFileUrls(contentJson);
      const filesToDelete = oldFiles.filter(url => !newFiles.includes(url));
      
      if (filesToDelete.length > 0) {
         Promise.all(filesToDelete.map(url => deleteFileFromStorage(url))).catch(console.error);
      }

      useCardStore.getState().clearFiles(); // очищаем стор blob

      const contentText = editor?.getText().slice(0, 200); //бд
      
      updateMutation.mutate({
        id: cardId!,
        updates: {
          title,
          description,
          background_image: coverUrl,
          content_json: contentJson,
          content_text: contentText,
          updated_at: new Date().toISOString()
        }
      });

    } catch (error: any) {
      toast({ title: 'Ошибка сохранения', description: error.message, status: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!confirm('Удалить карточку навсегда?')) return;
    setIsUploading(true);
    try {
      // собираем файлы на удаление
      const filesToDelete: string[] = [];

       // обложка
      if (card.background_image) {
         filesToDelete.push(card.background_image);
      }

      // файлы из контента (картинки, видео, аудио)
      if (card.content_json) {
         const editorFiles = extractFileUrls(card.content_json);
         filesToDelete.push(...editorFiles);
      }

      // параллельно удаляем файлы из облака
      if (filesToDelete.length > 0) {
         await Promise.all(filesToDelete.map(url => deleteFileFromStorage(url)));
      }
      
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
      const url = await uploadCardCover(file, cardId!);
      // Удаляем старую
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
      <Grid templateColumns={{ base: '1fr', md: '300px 1fr' }} gap={8} mb={10} mt={8}>
        {/* Обложка */}
        <GridItem>
          <AspectRatio ratio={2 / 3} w="100%">
             <Box borderRadius="lg" overflow="hidden" border="1px solid" borderColor="gray.200" bg="gray.100" position="relative" role="group">
               {coverUrl ? (
                 <Image src={coverUrl} w="100%" h="100%" objectFit="cover" />
               ) : (
                 <Flex align="center" justify="center" w="100%" h="100%" bg="gray.50" color="gray.400" flexDirection="column">
                    <Text>Нет обложки</Text>
                    {isEditMode && <Text fontSize="xs">(Вид заметки)</Text>}
                 </Flex>
               )}
               
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
          <VStack align="stretch" spacing={4} width={{base: "90vw", sm: "100%"}}>
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

      {/* Глобальный спиннер сорхранения */}
      {isUploading && (
        <Flex 
          position="fixed" top={0} left={0} right={0} bottom={0} 
          bg="blackAlpha.600" backdropFilter="blur(4px)" 
          zIndex={9999} 
          align="center" justify="center" 
          direction="column"
        >
           <Spinner size="xl" color="white" thickness="4px" speed="0.65s" />
           <Text color="white" mt={4} fontWeight="bold" fontSize="lg">Сохранение...</Text>
        </Flex>
      )}

    </Box>
  );
};