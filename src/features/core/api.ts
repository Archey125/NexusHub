import { supabase } from '../../lib/supabase';

// --- ТИПЫ ---
export interface Page {
  id: string;
  title: string;
  icon?: string;
  sort_order: number;
}

export interface Category {
  id: string;
  page_id: string;
  title: string;
  content_type: 'links' | 'cards' | 'audio' | 'generators';
  sort_order: number;
}

// --- СТРАНИЦЫ ---

export const getPages = async () => {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data as Page[];
};

export const createPage = async (title: string) => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('No user');

  const { data, error } = await supabase
    .from('pages')
    .insert([{ title, user_id: user.id }])
    .select()
    .single();
  
  if (error) throw error;
  return data as Page;
};

export const updatePage = async (id: string, updates: Partial<Page>) => {
  const { error } = await supabase.from('pages').update(updates).eq('id', id);
  if (error) throw error;
};

export const deletePage = async (id: string) => {
  // проверка на наличие категорий
  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('page_id', id);
    
  if (count && count > 0) throw new Error('Невозможно удалить страницу с категориями');

  const { error } = await supabase.from('pages').delete().eq('id', id);
  if (error) throw error;
};

// --- КАТЕГОРИИ ---

export const getCategories = async (pageId: string) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('page_id', pageId)
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  return data as Category[];
};

export const createCategory = async (pageId: string, title: string, type: string) => {
  const user = (await supabase.auth.getUser()).data.user;
  
  const { data, error } = await supabase
    .from('categories')
    .insert([{ 
      page_id: pageId, 
      title, 
      content_type: type, 
      user_id: user?.id 
    }])
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string) => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') throw new Error('Категория не пустая');
    throw error;
  }
};

// --- СОРТИРОВКА (RPC) ---
export const reorderPages = async (items: { id: string; sort_order: number }[]) => {
  const { error } = await supabase.rpc('reorder_pages', { items });
  if (error) throw error;
};

export const reorderCategories = async (items: { id: string; sort_order: number }[]) => {
  const { error } = await supabase.rpc('reorder_categories', { items });
  if (error) throw error;
};