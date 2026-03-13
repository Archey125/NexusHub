/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  Button, VStack, FormControl, FormLabel, Input, useToast, Text, Divider, AlertDialog,
  AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter
} from '@chakra-ui/react';
import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useThemeStore } from '../../store/themeStore';
import { useAuth } from '../auth/useAuth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: Props) => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { accentColor } = useThemeStore();
  const toast = useToast();
  const { signOut } = useAuth();

  // Для подтверждения удаления
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const cancelRef = useRef<any>(null);

  // Смена пароля
  const handleUpdatePassword = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Успешно', description: 'Пароль обновлен', status: 'success' });
      setNewPassword('');
      onClose();
    }
  };

  // Удаление аккаунта
  const handleDeleteAccount = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('delete_user');
    setLoading(false);

    if (error) {
      toast({ title: 'Ошибка удаления', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Аккаунт удален', status: 'warning' });
      signOut();
      onClose();
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Настройки профиля</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              
              <Text fontWeight="bold">Сменить пароль</Text>
              <FormControl>
                <FormLabel fontSize="sm">Новый пароль</FormLabel>
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  focusBorderColor={`${accentColor}.500`}
                />
              </FormControl>
              <Button 
                size="sm" 
                colorScheme={accentColor} 
                onClick={handleUpdatePassword}
                isDisabled={!newPassword}
                isLoading={loading}
              >
                Обновить пароль
              </Button>

              <Divider py={2} />

              <Text fontWeight="bold" color="red.500">Опасная зона</Text>
              <Text fontSize="xs" color="gray.500">
                Удаление аккаунта приведет к удалению всех ваших заметок, ссылок и файлов. Это действие необратимо.
              </Text>
              <Button colorScheme="red" variant="outline" size="sm" onClick={() => setIsAlertOpen(true)}>
                Удалить аккаунт
              </Button>

            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Окно подтверждения удаления */}
      <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={() => setIsAlertOpen(false)}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Удалить аккаунт?</AlertDialogHeader>
            <AlertDialogBody>Вы уверены? Восстановить данные будет невозможно.</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsAlertOpen(false)}>Отмена</Button>
              <Button colorScheme="red" onClick={handleDeleteAccount} ml={3} isLoading={loading}>
                Удалить
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};