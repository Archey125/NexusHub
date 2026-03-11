import { Box, IconButton, Tooltip } from '@chakra-ui/react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useState } from 'react';

interface Props {
  children: React.ReactNode;
  isSpoiler: boolean;
  isEditable: boolean;
  type?: 'overlay' | 'blur'; // overlay (для картинок) или blur (для плееров)
}

export const SpoilerWrapper = ({ children, isSpoiler, isEditable }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  // Спойлер активен, если:
  // 1. Нет флага isSpoiler
  // 2. Мы НЕ в режиме редактирования (в редакторе мы должны видеть контент)
  // 3. Пользователь еще не нажал "открыть" (isOpen)
  const isBlurred = isSpoiler && !isEditable && !isOpen;

  return (
    <Box 
      position="relative" 
      cursor={isBlurred ? 'pointer' : 'default'}
      onClick={(e) => {
        if (isBlurred) {
          e.stopPropagation(); // клик не работал на ссылку
          setIsOpen(true); 
        }
      }}
    >
      <Box
        filter={isBlurred ? 'blur(1.5rem)' : 'none'}
        transition="filter 0.4s ease"
        pointerEvents={isBlurred ? 'none' : 'auto'}
        opacity={isBlurred ? 0.8 : 1}
      >
        {children}
      </Box>
      
    </Box>
  );
};

// меню блока
export const SpoilerButton = ({ isSpoiler, onClick }: { isSpoiler: boolean, onClick: () => void }) => (
  <Tooltip label={isSpoiler ? "Убрать спойлер" : "Сделать спойлером"}>
    <IconButton 
      aria-label="spoiler" 
      icon={isSpoiler ? <FaEyeSlash /> : <FaEye />} 
      size="sm"
      colorScheme={isSpoiler ? "purple" : "gray"} 
      onClick={onClick} 
    />
  </Tooltip>
);