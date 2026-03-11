import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageBlock } from '../components/nodes/ImageBlock';

export const ImageNode = Node.create({
  name: 'imageBlock',
  group: 'block',
  atom: true,         // нельзя редактировать как текст
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      caption: { default: '' },
      isSpoiler: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'react-image-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['react-image-block', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlock);
  },
});