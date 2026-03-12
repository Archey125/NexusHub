import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CardCarouselBlock } from '../components/nodes/CardCarouselBlock';

export const CardCarouselNode = Node.create({
  name: 'cardCarouselBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      cardsData: { default: [] }, // ['id1', 'id2']
    };
  },

  parseHTML() { return [{ tag: 'react-card-carousel' }]; },
  renderHTML({ HTMLAttributes }) { return ['react-card-carousel', mergeAttributes(HTMLAttributes)]; },
  addNodeView() { return ReactNodeViewRenderer(CardCarouselBlock); },
});