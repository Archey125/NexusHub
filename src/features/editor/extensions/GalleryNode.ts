import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { GalleryBlock } from '../components/nodes/GalleryBlock';

export const GalleryNode = Node.create({
  name: 'galleryBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      images: { default: [] }, // массив объектов галереи
    };
  },

  parseHTML() { return [{ tag: 'react-gallery-block' }]; },
  renderHTML({ HTMLAttributes }) { return ['react-gallery-block', mergeAttributes(HTMLAttributes)]; },
  addNodeView() { return ReactNodeViewRenderer(GalleryBlock); },
});