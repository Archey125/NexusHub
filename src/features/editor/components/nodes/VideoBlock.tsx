/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeViewWrapper } from '@tiptap/react';
import { Box, Button, IconButton, Input, VStack, HStack, AspectRatio, Text, Flex, useColorModeValue } from '@chakra-ui/react';
import { DeleteIcon, AttachmentIcon, LinkIcon, RepeatIcon } from '@chakra-ui/icons';
import { useRef, useState } from 'react';
import { useCardStore } from '../../../../store/cardStore';
import { SpoilerWrapper, SpoilerButton } from '../SpoilerWrapper';

export const VideoBlock = (props: any) => {
  const { src, type, caption, isSpoiler } = props.node.attrs; // type: 'file' | 'youtube'

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [youtubeInput, setYoutubeInput] = useState('');
  const [isSelecting, setIsSelecting] = useState(!src);

  const addFile = useCardStore((state) => state.addFile);
  const isEditable = props.editor.isEditable;

  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const bg = useColorModeValue('gray.50', 'gray.800');

  // MP4 загрузка
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);
    addFile(blobUrl, file);

    props.updateAttributes({ src: blobUrl, type: 'file' });
    setIsSelecting(false);
  };

  // Youtube ссылка
  const handleYoutubeSubmit = () => {
    if (!youtubeInput) return;
    props.updateAttributes({ src: youtubeInput, type: 'youtube' }); // валидация
    setIsSelecting(false);
  };

  const handleDelete = () => props.deleteNode();

  return (
    <NodeViewWrapper className="react-component-video">
      <Box
        my={6} p={2} borderRadius="md" bg={isEditable ? bg : 'transparent'}
        border={isEditable ? "1px dashed" : "none"} borderColor={borderColor}
      >
        {isSelecting ? (
          // МЕНЮ ВЫБОРА
          <VStack spacing={4} align="stretch" p={4}>
            <Text fontWeight="bold" color="gray.500" fontSize="sm">Добавить видео</Text>

            {/* MP4 */}
            <Button leftIcon={<AttachmentIcon />} onClick={() => fileInputRef.current?.click()}>
              Загрузить MP4
            </Button>

            <Text textAlign="center" fontSize="xs" color="gray.400">- ИЛИ -</Text>

            {/* YouTube */}
            <HStack>
              <Input
                placeholder="Ссылка на YouTube..."
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
              />
              <IconButton aria-label="Add Link" icon={<LinkIcon />} onClick={handleYoutubeSubmit} />
            </HStack>

            {src && <Button size="xs" variant="ghost" onClick={() => setIsSelecting(false)}>Отмена</Button>}
            <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept="video/mp4,video/webm" />
          </VStack>
        ) : (
          // ПЛЕЕР
          <SpoilerWrapper
            isSpoiler={isSpoiler}
            isEditable={isEditable}
          >

            <Box position="relative" role="group">


              <AspectRatio ratio={16 / 9} w="100%" bg="black" borderRadius="md" overflow="hidden" pb={5}>
                {type === 'youtube' ? (
                  <iframe
                    src={getEmbedUrl(src)}
                    title="YouTube video"
                    allowFullScreen
                    style={{ border: 0 }}
                  />
                ) : (
                  <video src={src} controls style={{ width: '100%', height: '100%' }} />
                )}
              </AspectRatio>

              {/* Поле редактирования ссылки для YouTube */}
              {isEditable && type === 'youtube' && (
                <Input 
                  value={src} 
                  onChange={(e) => props.updateAttributes({ src: e.target.value })}
                  placeholder="Ссылка на YouTube"
                  size="sm" mb={2} variant="filled"
                />
              )}

              {/* Кнопки управления */}
              {isEditable && (
                <Flex
                  position="absolute" bottom={1} right={2} gap={2}
                  opacity={0} _groupHover={{ opacity: 1 }} transition="0.2s"
                >
                  <IconButton aria-label="Swap" icon={<RepeatIcon />} size="sm" onClick={() => setIsSelecting(true)} />
                  <IconButton aria-label="Delete" icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={handleDelete} />
                  {/* кнопка спойлера */}
                  <SpoilerButton isSpoiler={isSpoiler} onClick={() => props.updateAttributes({ isSpoiler: !isSpoiler })} />
                </Flex>
              )}

              {/* Подпись */}
              {isEditable ? (
                <Input 
                  mt={2} size="sm" variant="flushed" placeholder="Добавить подпись..."
                  w = {{sm: "40%", md:"60%", lg:"80%"}}
                  value={caption || ''}
                  onChange={(e) => props.updateAttributes({ caption: e.target.value })}
                />
              ) : (
                caption && <Text mt={2} fontSize="md" color="gray.400" textAlign="center">{caption}</Text>
              )}


            </Box>

          </SpoilerWrapper>
        )}
      </Box>
    </NodeViewWrapper>
  );
};

// YouTube ссылки
function getEmbedUrl(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const id = (match && match[2].length === 11) ? match[2] : null;
  return id ? `https://www.youtube.com/embed/${id}` : url;
}