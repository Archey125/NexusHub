/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import { 
  Box, Button, FormControl, FormLabel, Input, Stack, Heading, 
  Text, useToast, Container, useColorModeValue, Link 
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<'signIn' | 'signUp' | 'forgotPassword'>('signIn');
  
  const navigate = useNavigate();
  const toast = useToast();
  const { accentColor } = useThemeStore();
  const bgBox = useColorModeValue('white', 'gray.800');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === 'signUp') {
        const { error } = await supabase.auth.signUp({ 
          email, password, options: { data: { full_name: email.split('@')[0] } }
        });
        if (error) throw error;
        toast({ title: 'Регистрация успешна!', status: 'success' });
      } 
      else if (view === 'signIn') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } 
      else if (view === 'forgotPassword') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/update-password',
        });
        if (error) throw error;
        toast({ title: 'Проверьте почту!', description: 'Ссылка для сброса отправлена.', status: 'info' });
        setView('signIn');
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="lg" py={20}>
      <Box rounded="xl" bg={bgBox} boxShadow="xl" p={8} borderTop="4px solid" borderColor={`${accentColor}.500`}>
        <Stack spacing={6}>
          <Heading fontSize="3xl" textAlign="center">
            {view === 'signIn' && 'Вход'}
            {view === 'signUp' && 'Регистрация'}
            {view === 'forgotPassword' && 'Восстановление'}
          </Heading>
          
          <form onSubmit={handleAuth}>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </FormControl>
              
              {view !== 'forgotPassword' && (
                <FormControl>
                  <FormLabel>Пароль</FormLabel>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </FormControl>
              )}
              
              <Button type="submit" w="100%" colorScheme={accentColor} isLoading={loading}>
                {view === 'signIn' && 'Войти'}
                {view === 'signUp' && 'Зарегистрироваться'}
                {view === 'forgotPassword' && 'Отправить ссылку'}
              </Button>
            </Stack>
          </form>

          <Stack direction="row" justify="space-between" fontSize="sm">
             {view === 'signIn' ? (
               <>
                 <Link onClick={() => setView('forgotPassword')}>Забыли пароль?</Link>
                 <Link onClick={() => setView('signUp')} color={`${accentColor}.500`}>Создать аккаунт</Link>
               </>
             ) : (
               <Link onClick={() => setView('signIn')} color={`${accentColor}.500`}>Вернуться ко входу</Link>
             )}
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
};