import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Menu, MenuButton, MenuList, MenuItem, MenuDivider, 
  Button, IconButton, useDisclosure, Modal, ModalOverlay, 
  ModalContent, ModalHeader, ModalBody, ModalFooter, Input, useToast, Flex,
} from '@chakra-ui/react';
import { FaCopy, FaTrash, FaPlus } from 'react-icons/fa';
import { getTemplates, createTemplate, deleteTemplate, type Template } from '../../templates/api';
import { useThemeStore } from '../../../store/themeStore';

interface Props {
  editor: Editor;
}

export const TemplateMenu = ({ editor }: Props) => {
  const { accentColor } = useThemeStore();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newTitle, setNewTitle] = useState('');

  // загружаем шаблоны
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates
  });

  const createMutation = useMutation({
    mutationFn: () => createTemplate(newTitle, editor.getJSON()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      onClose();
      setNewTitle('');
      toast({ title: 'Шаблон сохранен', status: 'success' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] })
  });

  // вставка шаблона в текст
  const handleInsertTemplate = (template: Template) => {
    // вставляем контент шаблона в позицию каретки
    editor.chain().focus().insertContent(template.content_json).run();
  };

  return (
    <>
      <Menu>
        <MenuButton as={Button} size="sm" variant="ghost" leftIcon={<FaCopy />} colorScheme={accentColor}>
          Шаблоны
        </MenuButton>
        <MenuList zIndex={10}>
          <MenuItem icon={<FaPlus />} onClick={onOpen} fontWeight="bold">
            Сохранить как шаблон
          </MenuItem>
          <MenuDivider />
          
          {templates?.length === 0 && (
            <MenuItem isDisabled>Нет сохраненных шаблонов</MenuItem>
          )}

          {templates?.map((tpl) => (
            <Flex 
              key={tpl.id} 
              align="center" 
              justify="space-around" 
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
            >
              <IconButton 
                aria-label="delete" 
                icon={<FaTrash />} 
                colorScheme="red" 
                variant="ghost" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Удалить шаблон?')) deleteMutation.mutate(tpl.id);
                }}
              />
              
              <MenuItem color={`${accentColor}.200`} onClick={() => handleInsertTemplate(tpl)} bg="transparent" _hover={{ bg: 'transparent' }}>
                {tpl.title}
              </MenuItem>
            </Flex>
          ))}
        </MenuList>
      </Menu>

      {/* модалка сохранения шаблона */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Сохранить как шаблон</ModalHeader>
          <ModalBody>
            <Input 
              placeholder="Название шаблона" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Отмена</Button>
            <Button colorScheme={accentColor} onClick={() => newTitle && createMutation.mutate()}>
              Сохранить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};