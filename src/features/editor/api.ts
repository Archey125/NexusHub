/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '../../lib/supabase';
import { uploadFileToStorage, deleteFileFromStorage } from '../../lib/storage'; // Cloudinary

export const getCardFull = async (id: string) => {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const updateCard = async ({ id, updates }: { id: string, updates: any }) => {
  const { error } = await supabase.from('cards').update(updates).eq('id', id);
  if (error) throw error;
};

// удаление записи карточки
export const deleteCardRecord = async (id: string) => {
  const { error } = await supabase.from('cards').delete().eq('id', id);
  if (error) throw error;
};

// обложка
export const uploadCardCover = async (file: File, cardId: string) => {
  // Путь: nexushub/user_id/cards/UUID/cardCover/
  return await uploadFileToStorage(file, `cards/${cardId}/cardCover`);
};

// загрузка файлов (видео, картинки)
export const uploadEditorFile = async (file: File, cardId: string) => {
  return await uploadFileToStorage(file, `cards/${cardId}/cardFiles`);
};

export const deleteEditorFile = async (url: string) => {
  return await deleteFileFromStorage(url);
};

// список карточек по ID (для карусели)
export const getCardsByIds = async (ids: string[]) => {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase
    .from('cards')
    .select('id, title, background_image, description, category_id, sort_order, content_text')
    .in('id', ids);
  if (error) throw error;
  return data;
};