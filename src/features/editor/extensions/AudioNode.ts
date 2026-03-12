import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AudioBlock } from '../components/nodes/AudioBlock';

export const AudioNode = Node.create({
  name: 'audioBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: '' },
      artist: { default: '' },
      playlistTrackId: { default: null }, // ID трека в базе (если из плейлиста)
      trackType: { default: 'file' },
      isSpoiler: { default: false },
    };
  },

  parseHTML() { return [{ tag: 'react-audio-block' }]; },
  renderHTML({ HTMLAttributes }) { return ['react-audio-block', mergeAttributes(HTMLAttributes)]; },
  addNodeView() { return ReactNodeViewRenderer(AudioBlock); },
});