import { Mark, mergeAttributes } from '@tiptap/core';

export const SpoilerMark = Mark.create({
  name: 'spoiler',

  addAttributes() {
    return {
      class: {
        default: 'spoiler-blur',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (element) => (element as HTMLElement).classList.contains('spoiler-blur') && null,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'spoiler-blur' }), 0];
  },
});