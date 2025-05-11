import { useBlockNote } from '@/lib/blocknote';
import { vi } from 'vitest'

// Mock react-native-svg
vi.mock('react-native-svg', () => {
  return {
    __esModule: true,
    default: 'Svg',
    Svg: 'Svg',
    Circle: 'Circle',
    Rect: 'Rect',
    Path: 'Path',
    G: 'G',
  };
});

// Mock Tamagui components
vi.mock('tamagui', () => ({
  Popover: vi.fn(),
  Button: vi.fn(),
  SizableText: vi.fn(),
  ScrollView: vi.fn(),
  styled: vi.fn(),
  XStack: vi.fn(),
  YStack: vi.fn(),
  Stack: vi.fn(),
}))

vi.mock('@tamagui/lucide-icons', () => ({
  ChevronDown: vi.fn(),
}))

// Mock react-native
vi.mock('react-native', () => ({
  Image: vi.fn(),
  View: vi.fn(),
  Text: vi.fn(),
  StyleSheet: {
    create: vi.fn(),
  },
  Platform: {
    OS: 'web',
  },
  Dimensions: {
    get: vi.fn(),
  },
}))

// Mock CodeBlock extension
vi.mock('@/lib/tiptap-extension-code-block', () => ({
  default: {
    configure: vi.fn().mockReturnValue({
      addOptions: vi.fn(),
      addNodeView: vi.fn(),
    }),
  },
  CodeBlockLowlight: {
    configure: vi.fn().mockReturnValue({
      addOptions: vi.fn(),
      addNodeView: vi.fn(),
    }),
  },
}))


vi.mock('@/lib/tiptap-extension-code-block/code-block-lowlight', () => ({
  CodeBlockLowlight: {
    configure: vi.fn().mockReturnValue({}),
  },
}))

// // Mock createReactBlockSpec
// vi.mock('@/lib/blocknote', () => ({
//   BlockNoteEditor: vi.fn().mockImplementation(() => ({
//     isEditable: true,
//     getTextCursorPosition: vi.fn().mockReturnValue({
//       block: { id: '1', type: 'paragraph', props: {}, content: [], children: [] },
//     }),
//     insertBlocks: vi.fn(),
//     updateBlock: vi.fn(),
//     removeBlocks: vi.fn(),
//     addStyles: vi.fn(),
//     removeStyles: vi.fn(),
//     toggleStyles: vi.fn(),
//     createLink: vi.fn(),
//     addLink: vi.fn(),
//     setCurrentFilePath: vi.fn(),
//     getCurrentFilePath: vi.fn().mockReturnValue('/path/to/file.md'),
//   })),
//   Styles: {},
//   createReactBlockSpec: vi.fn().mockImplementation(() => ({
//     type: 'image',
//     propSchema: {},
//     node: {},
//   })),
//   defaultProps: {},
//   defaultBlockSchema: {},
// }))

// Mock Tiptap Editor
vi.mock('@tiptap/core', () => ({
  Editor: vi.fn().mockImplementation(() => ({
    view: {
      focus: vi.fn(),
      hasFocus: vi.fn(),
      dom: document.createElement('div'),
    },
    commands: {
      setTextSelection: vi.fn(),
      setMark: vi.fn(),
      unsetMark: vi.fn(),
      toggleMark: vi.fn(),
    },
    state: {
      selection: {
        from: 0,
        to: 0,
      },
      doc: {
        textBetween: vi.fn(),
        firstChild: {
          descendants: vi.fn(),
        },
      },
    },
    on: vi.fn(),
    isEditable: true,
    setEditable: vi.fn(),
    destroy: vi.fn(),
  })),
  Node: {
    create: vi.fn().mockImplementation((config) => ({
      ...config,
      group: 'blockContent',
    })),
  },
  Extension: {
    create: vi.fn().mockImplementation((config) => ({
      ...config,
    }))
  },
  findParentNode: vi.fn(),
  // Add the missing extensions
  extensions: {
    ClipboardTextSerializer: {
      configure: vi.fn().mockReturnValue({}),
    },
    Commands: {
      configure: vi.fn().mockReturnValue({}),
    },
    Editable: {
      configure: vi.fn().mockReturnValue({}),
    },
    FocusEvents: {
      configure: vi.fn().mockReturnValue({}),
    },
    History: {
      configure: vi.fn().mockReturnValue({}),
    },
    InputRules: {
      configure: vi.fn().mockReturnValue({}),
    },
    Keymap: {
      configure: vi.fn().mockReturnValue({}),
    },
    PasteRules: {
      configure: vi.fn().mockReturnValue({}),
    },
    Placeholder: {
      configure: vi.fn().mockReturnValue({}),
    },
    Selection: {
      configure: vi.fn().mockReturnValue({}),
    },
    TextSelection: {
      configure: vi.fn().mockReturnValue({}),
    },
  },
}))

// Also mock the BlockNoteExtensions module to avoid any issues
vi.mock('@/lib/blocknote/core/BlockNoteExtensions', () => ({
  default: vi.fn().mockReturnValue([]),
}))

vi.mock('@/lib/blocknote/core/extensions/UniqueID/UniqueID', () => ({
  default: {
    options: {
      generateID: vi.fn().mockReturnValue('test-id-1'),
    },
  },
}))