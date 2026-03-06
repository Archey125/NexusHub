import { ChakraProvider, Box } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './theme/theme';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';

import { Login } from './pages/Login';
import { DynamicPage } from './pages/DynamicPage';

import { GlobalPlayer } from './components/common/GlobalPlayer';


// Заглушки
const Home = () => <Box p={10}>Главная (В разработке)</Box>;

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          {/* Навбар */}
          <Navbar /> 
          
          <Box pt={4} pb="100px">
            <Routes>
              {/* Логин */}
              <Route path="/login" element={
                <Login />
              } />
              
              {/* Домашняя страница */}
              <Route path="/" element={
                <ProtectedRoute><Home /></ProtectedRoute>
              } />
              
              {/* Динамическая страница */}
              <Route path="/page/:pageId" element={
                <ProtectedRoute><DynamicPage /></ProtectedRoute>
              } />
            </Routes>
          </Box>
          
          {/* Плеер */}
          <GlobalPlayer />

        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;