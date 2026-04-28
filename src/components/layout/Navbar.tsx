import { 
  Box, Flex, Button, HStack, IconButton, useColorMode, 
  Menu, MenuButton, MenuList, Text, Avatar, useDisclosure, Collapse, VStack, Divider,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, Input, ModalFooter
} from '@chakra-ui/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MoonIcon, SunIcon, HamburgerIcon, AddIcon } from '@chakra-ui/icons'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useThemeStore } from '../../store/themeStore';
import { useAuth } from '../auth/useAuth';
import { getPages, createPage } from '../../features/core/api';
import { ProfileModal } from '../auth/ProfileModal'; 
import { Logo } from './Logo';

const COLORS = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'cyan', 'purple', 'pink'];

export const Navbar = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { accentColor, setAccentColor } = useThemeStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // обычное меню
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  // мобильное меню
  const { isOpen: isMobileMenuOpen, onToggle: toggleMobileMenu } = useDisclosure();

  
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
              <Logo/> NexusHub
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
            <IconButton size="sm" icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />} aria-label="Theme" onClick={toggleColorMode} variant="ghost" color={accentColor}/>

            {user && (
              <HStack spacing={2} ml={2} borderLeft="1px solid" borderColor="gray.600" pl={2}>
                 <Avatar size="xs" name={user.email} bg={`${accentColor}.500`} cursor="pointer" onClick={onProfileOpen} />
                 <Button size="xs" onClick={signOut}>Выйти</Button>
              </HStack>
            )}
          </Flex>

          {/* Мобильная кнопка (Гамбургер) */}
          <Box display={{ base: 'block', md: 'none' }}>
            <IconButton 
              icon={<HamburgerIcon />} 
              variant="outline" 
              size="sm" 
              colorScheme={accentColor}
              onClick={toggleMobileMenu} 
              aria-label="Toggle Navigation"
            />
          </Box>

        </Flex>

        {/* Выпадающее мобильное меню */}
        <Collapse in={isMobileMenuOpen} animateOpacity>
          <VStack 
            display={{ base: 'flex', md: 'none' }} 
            align="stretch" 
            spacing={4} 
            pb={4} 
            pt={2}
            maxH="80vh" 
            overflowY="auto"
            zIndex={9999}
          >
            {user && (
              <>
                <Text fontWeight="bold" color={`${accentColor}.500`} fontSize="sm" textAlign="center">Страницы</Text>
                {pages?.map((page) => (
                  <NavLink key={page.id} to={`/page/${page.id}`} onClick={toggleMobileMenu}>
                    <Button w="100%" justifyContent="center" variant="ghost" colorScheme={accentColor}>
                      {page.title}
                    </Button>
                  </NavLink>
                ))}
                <Button w="100%" justifyContent="center" leftIcon={<AddIcon />} onClick={() => { onAddOpen(); toggleMobileMenu(); }} color={`${accentColor}.500`} variant="ghost">
                  Новая страница
                </Button>
                <Divider />
              </>
            )}

            <Text fontWeight="bold" color={`${accentColor}.500`} textAlign="center" fontSize="sm">Тема и Акцент</Text>
            <IconButton w="100%" justifyContent="center" onClick={toggleColorMode} icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />} variant="ghost" aria-label="Theme"  color={accentColor}/>
            <Flex p={2} gap={2} wrap="wrap">
               {COLORS.map((c) => (
                  <Box key={c} as="button" bg={`${c}.500`} onClick={() => setAccentColor(c)} borderRadius="full" w={8} h={8} />
               ))}
            </Flex>

            <Divider />
            
            {user ? (
              <>
                <Button w="100%" justifyContent="center" variant="ghost">Профиль</Button>
                <Button w="100%" justifyContent="center" variant="ghost" colorScheme="red" onClick={signOut}>Выйти</Button>
              </>
            ) : (
              <Button w="100%" justifyContent="center" onClick={() => { navigate('/login'); toggleMobileMenu(); }} colorScheme="blue" variant="ghost">Войти</Button>
            )}
          </VStack>
        </Collapse>


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