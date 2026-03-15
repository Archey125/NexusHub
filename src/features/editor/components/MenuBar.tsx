/* eslint-disable @typescript-eslint/no-explicit-any */
import { Editor } from '@tiptap/react';
import { Button, ButtonGroup, Flex, IconButton, Tooltip, useColorModeValue, Box } from '@chakra-ui/react';
import { 
  FaBold, FaItalic, FaStrikethrough, 
  FaListUl, FaListOl, FaMinus,FaEyeSlash,
  FaUndo, FaRedo, FaLink, FaUnlink,
  FaQuoteRight,
  FaAlignLeft, FaAlignCenter, FaAlignRight,
  FaImage, FaImages, FaVideo, FaMusic, FaLayerGroup,//Иконки для сложных блоков
} from 'react-icons/fa';

interface Props {
  editor: Editor | null;
}

export const MenuBar = ({ editor }: Props) => {
   const bg = useColorModeValue ('white', 'gray.800');
  
  if (!editor) return null;

  const isActive = (typeOrAttrs: any , opts?: any) => editor.isActive(typeOrAttrs, opts) ? 'solid' : 'ghost';

  //настройка ссылки
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL ссылки:', previousUrl);

    if (url === null) return;

    // удаление при пустой строки
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // установка ссылки
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <Box 
      position="sticky" top="110px" zIndex={9}
      bg={bg} 
      borderBottom="1px solid" borderColor="gray.200"
      mb={4} pt={2} pb={2}
      boxShadow="sm"
    >
      <Flex 
        gap={2} 
        wrap="nowrap" // все в одну линию
        overflowX="auto"
        justify={{ base: 'center', md: 'flex-start' }}
         // скрыть полосу прокрутки
        css={{
          '&::-webkit-scrollbar': { display: 'none' },
          'msOverflowStyle': 'none',
          'scrollbarWidth': 'none',
        }}
        px={2}
      >
        
        {/* ТЕКСТ */}
        <ButtonGroup size="sm" isAttached variant="outline" flexShrink={0}>
          <IconButton aria-label="bold" icon={<FaBold />} variant={isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
          <IconButton aria-label="italic" icon={<FaItalic />} variant={isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
          <IconButton aria-label="strike" icon={<FaStrikethrough />} variant={isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
        </ButtonGroup>

        {/* ЗАГОЛОВКИ */}
        <ButtonGroup size="sm" isAttached variant="outline" flexShrink={0}>
          <Button variant={isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Button>
          <Button variant={isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Button>
        </ButtonGroup>

        {/* ВЫРАВНИВАНИЕ (НОВОЕ) */}
        <ButtonGroup size="sm" isAttached variant="outline" flexShrink={0}>
           <IconButton aria-label="left" icon={<FaAlignLeft />} variant={isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} />
           <IconButton aria-label="center" icon={<FaAlignCenter />} variant={isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} />
           <IconButton aria-label="right" icon={<FaAlignRight />} variant={isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} />
        </ButtonGroup>

        {/* СПИСКИ И ЦИТАТЫ */}
        <ButtonGroup size="sm" isAttached variant="outline" flexShrink={0}>
          <IconButton aria-label="bullet" icon={<FaListUl />} variant={isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
          <IconButton aria-label="ordered" icon={<FaListOl />} variant={isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
          <IconButton aria-label="quote" icon={<FaQuoteRight />} variant={isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        </ButtonGroup>

        {/* РАЗДЕЛИТЕЛЬ, СПОЙЛЕР И ССЫЛКА*/}
        <ButtonGroup size="sm" isAttached variant="outline">
          <Tooltip label="Линия"><IconButton aria-label="hr" icon={<FaMinus />} onClick={() => editor.chain().focus().setHorizontalRule().run()} /></Tooltip>

          <Tooltip label="Спойлер">
            <IconButton 
              aria-label="spoiler" 
              icon={<FaEyeSlash />} 
              variant={isActive('spoiler')} 
              onClick={() => editor.chain().focus().toggleMark('spoiler').run()} 
            />
          </Tooltip>

          <Tooltip label="Ссылка">
            <IconButton 
              aria-label="link" 
              icon={<FaLink />} 
              variant={isActive('link')} 
              onClick={setLink} 
            />
          </Tooltip>
          {editor.isActive('link') && (
            <Tooltip label="Убрать ссылку">
              <IconButton 
                aria-label="unlink" 
                icon={<FaUnlink />} 
                onClick={() => editor.chain().focus().unsetLink().run()} 
              />
            </Tooltip>
          )}

        </ButtonGroup>

        {/* СЛОЖНЫЕ БЛОКИ */}
        <ButtonGroup size="sm" isAttached variant="outline" flexShrink={0}>
          <Tooltip label="Картинка">
             <IconButton aria-label="img" icon={<FaImage />} onClick={() => editor.chain().focus().insertContent({ type: 'imageBlock' }).run()} />
          </Tooltip>
          <Tooltip label="Галерея">
             <IconButton aria-label="gallery" icon={<FaImages />} onClick={() => editor.chain().focus().insertContent({ type: 'galleryBlock' }).run()} />
          </Tooltip>
          <Tooltip label="Аудио">
             <IconButton aria-label="audio" icon={<FaMusic />} onClick={() => editor.chain().focus().insertContent({ type: 'audioBlock' }).run()} />
          </Tooltip>
          <Tooltip label="Видео">
            <IconButton aria-label="video" icon={<FaVideo />} onClick={() => editor.chain().focus().insertContent({ type: 'videoBlock' }).run()} />
          </Tooltip>
          <Tooltip label="Связанные карточки">
            <IconButton aria-label="cards" icon={<FaLayerGroup />} onClick={() => editor.chain().focus().insertContent({ type: 'cardCarouselBlock' }).run()} />
          </Tooltip>
        </ButtonGroup>


        <ButtonGroup size="sm" isAttached variant="outline" ml="auto">
          <IconButton aria-label="undo" icon={<FaUndo />} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
          <IconButton aria-label="redo" icon={<FaRedo />} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
        </ButtonGroup>
      </Flex>
    </Box>
  );
};