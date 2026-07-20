import { supabase } from '../../lib/supabase';
import type { JSONContent } from '@tiptap/react';

export interface Template {
  id: string;
  title: string;
  content_json: JSONContent;
}

// все шаблоны пользователя
export const getTemplates = async () => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Template[];
};

// новый шаблон
export const createTemplate = async (title: string, content_json: JSONContent) => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('No user');

  const { data, error } = await supabase
    .from('templates')
    .insert([{ title, content_json, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// удалить шаблон
export const deleteTemplate = async (id: string) => {
  const { error } = await supabase.from('templates').delete().eq('id', id);
  if (error) throw error;
};