import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@chakra-ui/react';

interface Props {
  id: string;
  children: React.ReactNode;
}

export const SortableItem = ({ id, children }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    
    // Стили для перетаскиваемого элемента
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative' as const,

    //Разрешаем скролл (pan-y), библиотека сама заблокирует его при активации драга
    touchAction: 'pan-y', 

    // Эффекты при "захвате"
    scale: isDragging ? '1.05' : '1', // Немного увеличиваем
    boxShadow: isDragging ? 'xl' : 'none', // Добавляем тень
    cursor: isDragging ? 'grabbing' : 'pointer', // Курсор-кулак
  };

  return (
    <Box 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      h="100%"
      // Плавная анимация увеличения при захвате (опционально через transition)
      transition="box-shadow 0.2s, transform 0.2s, opacity 0.2s"
    >
        {children}
    </Box>
  );
};