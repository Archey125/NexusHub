import { supabase } from '../../lib/supabase';
import { uploadFileToStorage, deleteFileFromStorage } from '../../lib/storage';
import * as mm from 'music-metadata-browser';
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') window.Buffer = Buffer;

export interface Track {
  id: string;
  category_id: string;
  title: string;
  artist?: string;
  duration?: number;
  storage_path: string;
  sort_order: number;
  url?: string; 
}

export const getTracks = async (categoryId: string) => {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true });
  
  if (error) throw error;

  // Адаптер для URL
  return data.map(t => ({ ...t, url: t.storage_path })) as Track[];
};

export const uploadTrack = async ({ file, categoryId }: { file: File, categoryId: string }) => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('No user');

  // Метаданные
  let title = file.name.replace(/\.[^/.]+$/, "");
  let artist = 'Unknown Artist';
  let duration = 0;

  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }

  try {
    const metadata = await mm.parseBlob(file);
    if (metadata.common.title) title = metadata.common.title;
    if (metadata.common.artist) artist = metadata.common.artist;
    if (metadata.format.duration) duration = Math.round(metadata.format.duration);
  } catch (e) { console.warn('Metadata error', e); }

  const url = await uploadFileToStorage(file, `music/${categoryId}`);

  const { error } = await supabase.from('tracks').insert([{
    user_id: user.id,
    category_id: categoryId,
    title,
    artist,
    duration,
    storage_path: url,
    mime_type: file.type
  }]);

  if (error) throw error;
};

export const deleteTrack = async (track: Track) => {
  if (track.storage_path) await deleteFileFromStorage(track.storage_path);
  const { error } = await supabase.from('tracks').delete().eq('id', track.id);
  if (error) throw error;
};

export const updateTracksOrder = async (items: { id: string; sort_order: number }[]) => {
  const { error } = await supabase.rpc('reorder_tracks', { items });
  if (error) throw error;
};