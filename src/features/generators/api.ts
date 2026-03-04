import { supabase } from '../../lib/supabase';

export interface Generator {
  id: string;
  category_id: string;
  title: string;
  type: 'custom' | 'number';
  options: string[]; // Для 'custom': ["A", "B"], для 'number': ["1", "100"]
  sort_order: number;
}

// Получить генераторы категории
export const getGenerators = async (categoryId: string) => {
  const { data, error } = await supabase
    .from('generators')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data as Generator[];
};

// Создать
export const createGenerator = async (category_id: string, title: string, type: 'custom' | 'number') => {
  const user = (await supabase.auth.getUser()).data.user;
  const { data, error } = await supabase
    .from('generators')
    .insert([{ 
      category_id, 
      title, 
      type, 
      user_id: user?.id, 
      options: type === 'number' ? ['1', '100'] : [] // Дефолтные опции
    }])
    .select().single();
  if (error) throw error;
  return data;
};

// Обновить (Опции)
export const updateGenerator = async (id: string, options: string[]) => {
  const { error } = await supabase.from('generators').update({ options }).eq('id', id);
  if (error) throw error;
};

// Удалить
export const deleteGenerator = async (id: string) => {
  const { error } = await supabase.from('generators').delete().eq('id', id);
  if (error) throw error;
};

// Сортировка (RPC)
export const updateGeneratorsOrder = async (items: { id: string; sort_order: number }[]) => {
  const { error } = await supabase.rpc('reorder_generators', { items });
  if (error) throw error;
};