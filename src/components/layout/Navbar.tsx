/* eslint-disable @typescript-eslint/no-unused-vars */
import { 
  Box, Flex, Button, HStack, IconButton, useColorMode, 
  Menu, MenuButton, MenuList, MenuItem, Text, Avatar, useDisclosure, 
  MenuDivider, MenuGroup, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, Input, ModalFooter
} from '@chakra-ui/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MoonIcon, SunIcon, HamburgerIcon, AddIcon } from '@chakra-ui/icons'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useThemeStore } from '../../store/themeStore';
import { useAuth } from '../auth/AuthProvider';
import { getPages, createPage } from '../../features/core/api';
import { ProfileModal } from '../auth/ProfileModal'; 

const COLORS = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'cyan', 'purple', 'pink'];

export const Navbar = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { accentColor, setAccentColor } = useThemeStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const [newPageTitle, setNewPageTitle] = useState('');
  
  const { isOpen: isProfileOpen, onOpen: onProfileOpen, onClose: onProfileClose } = useDisclosure();

  const { data: pages } = useQuery({ 
    queryKey: ['pages'], queryFn: getPages, enabled: !!user 
  });

  const createPageMutation = useMutation({
    mutationFn: createPage,
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      setNewPageTitle('');
      onAddClose();
      navigate(`/page/${newPage.id}`);
    }
  });

  return (
    <>
      <Box px={4} bg={colorMode === 'dark' ? 'gray.800' : 'white'} borderBottom="1px solid" borderColor="gray.700" position="sticky" top={0} zIndex={100}>
        <Flex h={16} alignItems="center" justifyContent="space-between">
          
          {/* ЛОГОТИП */}
          <NavLink to="/">
            <Text fontSize="xl" fontWeight="900" letterSpacing="tight" color={`${accentColor}.500`}>
              NexusHub
            </Text>
          </NavLink>

          {/* Центр (Десктоп): Страницы */}
          {user && (
            <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
              {pages?.map((page) => (
                <NavLink key={page.id} to={`/page/${page.id}`}>
                  {({ isActive }) => (
                    <Button variant={isActive ? 'solid' : 'ghost'} colorScheme={accentColor} size="sm" flexShrink={0}>
                      {page.title}
                    </Button>
                  )}
                </NavLink>
              ))}
              <IconButton aria-label="Создать" icon={<AddIcon />} size="xs" onClick={onAddOpen} />
            </HStack>
          )}

          {/* Право (Десктоп) */}
          <Flex alignItems="center" gap={2} display={{ base: 'none', md: 'flex' }}>
            <Menu>
              <MenuButton as={Button} size="xs" variant="outline" colorScheme={accentColor}>Цвет</MenuButton>
              <MenuList minW="0" w="150px" zIndex={102}>
                <Flex wrap="wrap" gap={2} p={2} justify="center">
                  {COLORS.map(c => <Button key={c} size="xs" bg={`${c}.500`} onClick={() => setAccentColor(c)} borderRadius="full" w={6} h={6} />)}
                </Flex>
              </MenuList>
            </Menu>
            <IconButton size="sm" icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />} aria-label="Theme" onClick={toggleColorMode} variant="ghost" />

            {user && (
              <HStack spacing={2} ml={2} borderLeft="1px solid" borderColor="gray.600" pl={2}>
                 <Avatar size="xs" name={user.email} bg={`${accentColor}.500`} cursor="pointer" onClick={onProfileOpen} />
                 <Button size="xs" onClick={signOut}>Выйти</Button>
              </HStack>
            )}
          </Flex>

          {/* Мобильное меню (Гамбургер) */}
          <Box display={{ base: 'block', md: 'none' }}>
            <Menu>
              <MenuButton as={IconButton} icon={<HamburgerIcon />} variant="outline" size="sm" />
              <MenuList zIndex={1001} maxH="80vh" overflowY="auto">
                {user && (
                  <>
                    <MenuGroup title="Страницы">
                      {pages?.map((page) => (
                        <NavLink key={page.id} to={`/page/${page.id}`}>
                          <MenuItem>{page.title}</MenuItem>
                        </NavLink>
                      ))}
                      <MenuItem icon={<AddIcon />} onClick={onAddOpen} color={`${accentColor}.500`}>
                        Новая страница
                      </MenuItem>
                    </MenuGroup>
                    <MenuDivider />
                  </>
                )}

                <MenuItem onClick={toggleColorMode} icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}>
                  Сменить тему
                </MenuItem>
                
                <MenuGroup title="Цвет акцента">
                   <Flex p={2} gap={2} wrap="wrap">
                      {COLORS.map((c) => (
                        <Button key={c} size="xs" bg={`${c}.500`} onClick={() => setAccentColor(c)} borderRadius="full" w={6} h={6}/>
                      ))}
                   </Flex>
                </MenuGroup>

                <MenuDivider />
                
                {user ? (
                  <>
                    <MenuItem>Профиль</MenuItem>
                    <MenuItem onClick={signOut} color="red.500">Выйти</MenuItem>
                  </>
                ) : (
                    <MenuItem onClick={() => navigate('/login')} color="blue.500">Войти</MenuItem>
                )}
              </MenuList>
            </Menu>
          </Box>

        </Flex>
      </Box>

      {/* Модалка создания страницы */}
      <Modal isOpen={isAddOpen} onClose={onAddClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Новая страница</ModalHeader>
          <ModalBody>
            <Input placeholder="Название (напр. Работа, Хобби)" value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} autoFocus />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddClose}>Отмена</Button>
            <Button colorScheme={accentColor} onClick={() => newPageTitle && createPageMutation.mutate(newPageTitle)}>Создать</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Модалка профиля */}
      <ProfileModal isOpen={isProfileOpen} onClose={onProfileClose} />
    </>
  );
};