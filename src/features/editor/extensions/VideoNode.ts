import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { VideoBlock } from '../components/nodes/VideoBlock';

export const VideoNode = Node.create({
  name: 'videoBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      type: { default: 'file' }, // 'file' | 'youtube'
      isSpoiler: { default: false },
    };
  },

  parseHTML() { return [{ tag: 'react-video-block' }]; },
  renderHTML({ HTMLAttributes }) { return ['react-video-block', mergeAttributes(HTMLAttributes)]; },
  addNodeView() { return ReactNodeViewRenderer(VideoBlock); },
});