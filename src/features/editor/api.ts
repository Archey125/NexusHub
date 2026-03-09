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

export const deleteCardRecord = async (id: string) => {
  const { error } = await supabase.from('cards').delete().eq('id', id);
  if (error) throw error;
};

export const uploadEditorFile = async (file: File) => {
  return await uploadFileToStorage(file, 'editor_files');
};

export const deleteEditorFile = async (url: string) => {
  return await deleteFileFromStorage(url);
};