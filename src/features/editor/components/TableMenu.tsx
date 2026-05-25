import { Editor } from '@tiptap/react';
import { useState, useEffect } from 'react';
import {
  IconButton, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Tooltip
} from '@chakra-ui/react';
import {
  FaTable, FaPlus, FaTrash, FaObjectGroup, FaObjectUngroup
} from 'react-icons/fa';
import { useThemeStore } from '../../../store/themeStore';

interface Props {
  editor: Editor;
}

export const TableMenu = ({ editor }: Props) => {
  const { accentColor } = useThemeStore();

  const [, setTick] = useState(0);

  useEffect(() => {
    const update = () => setTick(t => t + 1);

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);

    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  const isTableContext = editor.can().deleteTable();


  // фокус не в таблице -> показываем кнопку "Создать"
  if (!isTableContext) {
    return (
      <Tooltip label="Вставить таблицу (3x3)">
        <IconButton
          aria-label="insert-table"
          icon={<FaTable />}
          size="sm"
          variant="outline"
          colorScheme={accentColor}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        />
      </Tooltip>
    );
  }

  // фокус В таблице -> показываем выпадающее меню настроек
  return (
    <Menu placement="bottom-start">
      <Tooltip label="Настройки таблицы">
        <MenuButton
          as={IconButton}
          aria-label="table-settings"
          icon={<FaTable />}
          size="sm"
          colorScheme={accentColor}
          variant="solid"
        />
      </Tooltip>
      <MenuList zIndex={10} fontSize="sm">

        {/* Строки и Столбцы */}
        <MenuItem icon={<FaPlus />} onClick={() => editor.chain().focus().addColumnAfter().run()}>Добавить столбец</MenuItem>
        <MenuItem icon={<FaTrash />} color="red.500" onClick={() => editor.chain().focus().deleteColumn().run()}>Удалить столбец</MenuItem>
        <MenuDivider />
        <MenuItem icon={<FaPlus />} onClick={() => editor.chain().focus().addRowAfter().run()}>Добавить строку</MenuItem>
        <MenuItem icon={<FaTrash />} color="red.500" onClick={() => editor.chain().focus().deleteRow().run()}>Удалить строку</MenuItem>
        <MenuDivider />

        {/* Объединение (кнопки активны только если действие возможно) */}
        <MenuItem
          icon={<FaObjectGroup />}
          isDisabled={!editor.can().mergeCells()}
          onClick={() => editor.chain().focus().mergeCells().run()}
        >
          Объединить ячейки
        </MenuItem>
        <MenuItem
          icon={<FaObjectUngroup />}
          isDisabled={!editor.can().splitCell()}
          onClick={() => editor.chain().focus().splitCell().run()}
        >
          Разделить ячейку
        </MenuItem>
        <MenuDivider />

        {/* Удаление */}
        <MenuItem icon={<FaTrash />} color="red.500" onClick={() => editor.chain().focus().deleteTable().run()}>Удалить таблицу</MenuItem>
      </MenuList>
    </Menu>
  );
};