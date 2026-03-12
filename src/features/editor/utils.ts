/* eslint-disable @typescript-eslint/no-explicit-any */
import { type JSONContent } from '@tiptap/react';
import { useCardStore } from '../../store/cardStore';
import { uploadEditorFile } from './api';

// Поиск всех URL файлов в статье (для удаления мусора) (только URL, не blob)
export const extractFileUrls = (content: JSONContent | null | undefined): string[] => {
  if (!content) return [];
  
  let urls: string[] = [];

  // Картинка
  if (content.type === 'imageBlock' && content.attrs?.src) {
    const src = content.attrs.src;
    if (!src.startsWith('blob:')) urls.push(src);
  }

  // Галерея
  if (content.type === 'galleryBlock' && content.attrs?.images) {
    content.attrs.images.forEach((img: any) => {
      if (img.src && !img.src.startsWith('blob:')) urls.push(img.src);
    });
  }

  // Аудио (из загруженных)
  if (content.type === 'audioBlock' && content.attrs?.src && content.attrs?.trackType === 'file') {
     const src = content.attrs.src;
     if (!src.startsWith('blob:')) urls.push(src);
  }

  // Видео
  if (content.type === 'videoBlock' && content.attrs?.src && content.attrs?.type === 'file') {
     const src = content.attrs.src;
     if (!src.startsWith('blob:')) urls.push(src);
  }
  
  // Рекурсивный поиск во вложенных узлах
  if (content.content) {
    content.content.forEach((child) => {
      urls = [...urls, ...extractFileUrls(child)];
    });
  }

  return urls;
};

// Извлечение ID связанных карточек
export const extractLinkedCardIds = (content: any): string[] => {
  if (!content) return [];
  let ids: string[] = [];

  if (content.type === 'cardCarouselBlock' && content.attrs?.cardsData) {
    content.attrs.cardsData.forEach((c: any) => {
        if (c.id) ids.push(c.id);
    });
  }

  if (content.content && Array.isArray(content.content)) {
    content.content.forEach((child: any) => {
    ids = [...ids, ...extractLinkedCardIds(child)];
    });
  }

  return Array.from(new Set(ids)); // убираем дубликаты
};

// Обработка контента перед сохранением через blob
export const processContentAndUpload = async (json: any, cardId: string): Promise<any> => {
  if (!json) return json;

  // обрабатываем каждый блок в массиве
  if (Array.isArray(json)) {
    return Promise.all(json.map(item => processContentAndUpload(item, cardId)));
  }

  if (typeof json === 'object') {
    const newJson = { ...json }; // копия

    // Картинки
    if (newJson.type === 'imageBlock' && newJson.attrs?.src?.startsWith('blob:')) {
      const file = useCardStore.getState().getFile(newJson.attrs.src);
      if (file) {
        try {
          const url = await uploadEditorFile(file, cardId); 
          newJson.attrs.src = url; // подмена blob на https
        } catch (e) {
          console.error('Failed to upload image:', e);
          throw new Error('Ошибка загрузки изображения');
        }
      }
    }

    // Галерея
    if (newJson.type === 'galleryBlock' && newJson.attrs?.images) {
       // массив картинок в галерее параллельно
       const newImages = await Promise.all(newJson.attrs.images.map(async (img: any) => {
          if (img.src.startsWith('blob:')) {
             const file = useCardStore.getState().getFile(img.src);
             if (file) {
                const url = await uploadEditorFile(file, cardId);
                return { ...img, src: url };
             }
          }
          return img;
       }));
       newJson.attrs.images = newImages;
    }

    // Аужио через blob
    if (newJson.type === 'audioBlock' && newJson.attrs?.src?.startsWith('blob:') && newJson.attrs?.trackType === 'file') {
       const file = useCardStore.getState().getFile(newJson.attrs.src);
       if (file) {
          const url = await uploadEditorFile(file, cardId);
          newJson.attrs.src = url;
       }
    }

    // Видео
    if (newJson.type === 'videoBlock' && newJson.attrs?.src?.startsWith('blob:') && newJson.attrs?.type === 'file') {
       const file = useCardStore.getState().getFile(newJson.attrs.src);
       if (file) {
          const url = await uploadEditorFile(file, cardId);
          newJson.attrs.src = url;
       }
    }

    // Рекурсия для вложенных элементов
    if (newJson.content) {
      newJson.content = await processContentAndUpload(newJson.content, cardId);
    }

    return newJson;
  }

  return json;
};