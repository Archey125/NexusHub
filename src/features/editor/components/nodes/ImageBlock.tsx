/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeViewWrapper } from '@tiptap/react';
import { Box, Image, Button, Input, VStack, Flex, Text, } from '@chakra-ui/react';
import { DeleteIcon, AttachmentIcon } from '@chakra-ui/icons';
import { useRef } from 'react';
import { useCardStore } from '../../../../store/cardStore';
import { SpoilerWrapper, SpoilerButton } from '../SpoilerWrapper';

export const ImageBlock = (props: any) => {
  const { src, caption, isSpoiler } = props.node.attrs;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // функция из стора
  const addFile = useCardStore((state) => state.addFile);
  const isEditable = props.editor.isEditable;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);

    addFile(blobUrl, file);

    props.updateAttributes({ src: blobUrl });
  };

  const handleDelete = () => {
    props.deleteNode();
  };

  return (
    <NodeViewWrapper className="react-component-image">
      <Box 
        my={6} 
        border={isEditable ? "1px dashed" : "none"} 
        borderColor="gray.300" 
        borderRadius="md" 
        bg={isEditable ? "gray.50" : "transparent"} 
        _dark={{ bg: isEditable ? 'gray.800' : 'transparent', borderColor: 'gray.600' }}
        p={isEditable ? 2 : 0}
        position="relative" 
        role="group"
      >
        {src ? (

          <SpoilerWrapper 
           isSpoiler={isSpoiler} 
           isEditable={isEditable}
         >

          <VStack spacing={2}>
             <Box position="relative" w="100%" display="flex" justifyContent="center" bg="blackAlpha.50" borderRadius="md" overflow="hidden">
                <Image 
                  src={src} 
                  maxH="600px" w="auto" maxW="100%" objectFit="contain" 
                />
                
                {isEditable && (
                  <Flex 
                    position="absolute" inset={0} bg="blackAlpha.600" 
                    opacity={0} _groupHover={{ opacity: 1 }} transition="0.2s"
                    align="center" justify="center" gap={2}
                  >
                     <Button size="sm" leftIcon={<AttachmentIcon />} onClick={() => fileInputRef.current?.click()}>
                       Заменить
                     </Button>
                     <Button size="sm" colorScheme="red" leftIcon={<DeleteIcon />} onClick={handleDelete}>
                       Удалить
                     </Button>

                      {/* Добавляем кнопку спойлера */}
                      <SpoilerButton isSpoiler={isSpoiler} onClick={() => props.updateAttributes({ isSpoiler: !isSpoiler })} />

                  </Flex>
                )}
             </Box>
             
             {isEditable ? (
               <Input 
                 placeholder="Подпись..." variant="flushed" textAlign="center" fontSize="sm" color="gray.500"
                 value={caption || ''}
                 onChange={(e) => props.updateAttributes({ caption: e.target.value })}
               />
             ) : (
               caption && <Text fontSize="sm" color="gray.500" textAlign="center" fontStyle="italic">{caption}</Text>
             )}
          </VStack>

          </SpoilerWrapper>
        ) : (
          <Flex direction="column" align="center" justify="center" p={8} gap={4}>
             <Text color="gray.500">Загрузите изображение</Text>
             <Button leftIcon={<AttachmentIcon />} onClick={() => fileInputRef.current?.click()}>
               Выбрать файл
             </Button>
          </Flex>
        )}
        <input type="file" hidden ref={fileInputRef} onChange={handleFileSelect} accept="image/*" />
      </Box>
    </NodeViewWrapper>
  );
};