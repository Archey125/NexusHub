import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Box, ButtonGroup, IconButton, useColorModeValue } from '@chakra-ui/react';
import { 
  FaBold, FaItalic, FaListUl, FaListOl,FaMinus,
  FaAlignLeft, FaAlignCenter, FaAlignRight
 } from 'react-icons/fa';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect } from 'react';

interface Props {
  content: string;
  onChange: (html: string) => void;
}

export const TipTapMini = ({ content, onChange }: Props) => {
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.600');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none p-2 min-h-[150px]',
      },
    },
  });

  // синхронизация контента
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
       if (editor.getText() === '' && content === '') return;
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <Box border="1px solid" borderColor={border} borderRadius="md" overflow="hidden" bg={bg}>
      {/* Мини-меню */}
      <ButtonGroup size="md" isAttached variant="ghost">
        <IconButton aria-label="bold" icon={<FaBold />} onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} />
        <IconButton aria-label="italic" icon={<FaItalic />} onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} />
        <IconButton aria-label="ul" icon={<FaListUl />} onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} />
        <IconButton aria-label="ol" icon={<FaListOl />} onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} />
        <IconButton aria-label="left" icon={<FaAlignLeft />} onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })}/>
        <IconButton aria-label="center" icon={<FaAlignCenter />} onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })}/>
        <IconButton aria-label="right" icon={<FaAlignRight />} onClick={() => editor.chain().focus().setTextAlign('right').run()}  isActive={editor.isActive({ textAlign: 'right' })}/>
        <IconButton aria-label="hr" icon={<FaMinus />} onClick={() => editor.chain().focus().setHorizontalRule().run()} />
      </ButtonGroup>
      
      <EditorContent editor={editor} />
    </Box>
  );
};