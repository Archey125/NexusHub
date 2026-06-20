import { Editor } from '@tiptap/react';
import { useState, useEffect } from 'react';
import {
  Box, Drawer, DrawerBody, DrawerHeader, DrawerOverlay,
  DrawerContent, DrawerCloseButton, useDisclosure,
  IconButton, VStack, Text, useColorModeValue, Tooltip
} from '@chakra-ui/react';
import { FaListUl } from 'react-icons/fa';
import { useThemeStore } from '../../../store/themeStore';

interface TOCItem {
  level: number;
  text: string;
  pos: number;
}

interface Props {
  editor: Editor | null;
}

export const TableOfContents = ({ editor }: Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [items, setItems] = useState<TOCItem[]>([]);
  const { accentColor } = useThemeStore();
  
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  useEffect(() => {
    if (!editor) return;

    // парсинг заголовков из дерева TipTap
    const updateTOC = () => {
      const headings: TOCItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          headings.push({
            level: node.attrs.level,
            text: node.textContent,
            pos, // позиция узла в документе
          });
        }
      });
      setItems(headings);
    };

    // сбор при монтировании
    updateTOC();

    // при апдейте в редакторе обновляем
    editor.on('update', updateTOC);

    return () => {
      editor.off('update', updateTOC);
    };
  }, [editor]);


  const handleScrollTo = (pos: number) => {
    if (!editor) return;
    
    // реальный DOM-элемент по его позиции в TipTap
    const domElement = editor.view.nodeDOM(pos) as HTMLElement;
    if (domElement) {
      // скроллим страницу к этому элементу
      domElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    onClose(); // закрываем панель после клика (для мобилок)
  };

  if (!editor || items.length === 0) return null;

  return (
    <>
      {/* Плавающая кнопка вызова */}
      <Box position="fixed" top="50%" right={0} transform="translateY(-50%)" zIndex={100}>
        <Tooltip label="Оглавление" placement="left">
          <IconButton
            aria-label="toc-button"
            icon={<FaListUl />}
            onClick={onOpen}
            colorScheme={accentColor}
            borderRightRadius={0}
            boxShadow="lg"
            opacity={0.8}
            _hover={{ opacity: 1, paddingRight: '1rem' }}
            transition="all 0.2s"
          />
        </Tooltip>
      </Box>

      {/* Выдвижная панель */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Оглавление</DrawerHeader>

          <DrawerBody p={0}>
            <VStack align="stretch" spacing={0} py={2}>
              {items.map((item, index) => (
                <Text
                  key={`${item.pos}-${index}`}
                  onClick={() => handleScrollTo(item.pos)}
                  cursor="pointer"
                  py={2}
                  pr={4}
                  // сдвигаем вложенные заголовки (h2, h3) правее
                  pl={`${(item.level - 1) * 1.5 + 1}rem`}
                  fontSize={item.level === 1 ? 'md' : 'sm'}
                  fontWeight={item.level === 1 ? 'bold' : 'normal'}
                  _hover={{ bg: hoverBg, color: `${accentColor}.500` }}
                  transition="background 0.2s"
                  noOfLines={1}
                >
                  {item.text || 'Пустой заголовок'}
                </Text>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};