import { Table } from '@tiptap/extension-table';

export const TableNode = Table.configure({
  resizable: true,
  handleWidth: 12,
  cellMinWidth: 50,
}).extend({
  addAttributes() {
    return {
      ...this.parent?.(),
    };
  },
});