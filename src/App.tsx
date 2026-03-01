import { ChakraProvider, Box } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './theme/theme';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';

import { Login } from './pages/Login';


// Заглушки
const Home = () => <Box p={10}>Главная (В разработке)</Box>;
const DynamicPage = () => <Box p={10}>Страница (В разработке)</Box>;

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          {/* Навбар */}
          <Navbar /> 
          
          <Box pt={4}>
            <Routes>
              {/* Логин */}
              <Route path="/login" element={
                <Login />
              } />
              
              {/* Домашняя страницы */}
              <Route path="/" element={
                <ProtectedRoute><Home /></ProtectedRoute>
              } />
              
              {/* Динамическая страница */}
              <Route path="/page/:pageId" element={
                <ProtectedRoute><DynamicPage /></ProtectedRoute>
              } />
            </Routes>
          </Box>
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;