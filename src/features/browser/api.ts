import { supabase } from '../../lib/supabase';

export interface LinkItem {
  id: string;
  category_id: string;
  title: string;
  url: string;
  icon_url?: string;
}

export const getLinks = async (categoryId: string) => {
  const { data, error } = await supabase
    .from('browser_links')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
};

export const createLink = async (category_id: string, title: string, url: string) => {
  if (!url.startsWith('http')) url = `https://${url}`;
  const user = (await supabase.auth.getUser()).data.user;
  // парсинг иконки
  const domain = new URL(url).hostname;
  const icon_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  const { data, error } = await supabase
    .from('browser_links')
    .insert([{ category_id, title, url, icon_url, user_id: user?.id }])
    .select().single();
  if (error) throw error;
  return data;
};

export const deleteLink = async (id: string) => {
  const { error } = await supabase
    .from('browser_links')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const updateLink = async (id: string, title: string, url: string) => {
  if (!url.startsWith('http')) url = `https://${url}`;
  const { error } = await supabase.from('browser_links').update({ title, url }).eq('id', id);
  if (error) throw error;
}

export const updateLinksOrder = async (items: { id: string; sort_order: number }[]) => {
  const { error } = await supabase.rpc('reorder_links', { items });
  if (error) throw error;
};