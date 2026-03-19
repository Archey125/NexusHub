import { supabase } from '../../lib/supabase';

export interface Card {
  id: string;
  category_id: string;
  title: string;
  description?: string;
  background_image?: string;
  content_text?: string;
  sort_order: number;
}

// превью
export const getCards = async (categoryId: string) => {
  const { data, error } = await supabase
    .from('cards')
    .select('id, category_id, title, description, background_image, content_text, sort_order, linked_card_ids')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data as Card[];
};

export const createCard = async (categoryId: string, title: string) => {
  const user = (await supabase.auth.getUser()).data.user;
  const { data, error } = await supabase
    .from('cards')
    .insert([{ 
      category_id: categoryId, 
      title, 
      user_id: user?.id,
      description: 'Краткое описание...',
      content_text: ''
    }])
    .select().single();
  if (error) throw error;
  return data;
};

export const updateCardsOrder = async (items: { id: string; sort_order: number }[]) => {
  const { error } = await supabase.rpc('reorder_cards', { items });
  if (error) throw error;
};