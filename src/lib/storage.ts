import { supabase } from './supabase';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET;

export const uploadFileToStorage = async (file: File, path: string) => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Unauthorized');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  // Папка: nexushub / user_id / folder_name
  const fullPath = `nexushub/${user.id}/${path}`;
  formData.append('folder', fullPath);

  let resourceType = 'auto'; 
  if (file.type.startsWith('audio/')) resourceType = 'video';
  
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.secure_url; 
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
};

export const deleteFileFromStorage = async (fileUrl: string) => {
  console.log('File removed from DB (physical file remains in Cloudinary):', fileUrl);
  return Promise.resolve();
};