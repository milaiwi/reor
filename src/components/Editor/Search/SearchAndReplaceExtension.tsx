import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Node as PMNode } from 'prosemirror-model'
import { BlockNoteEditor } from '@/lib/blocknote'

const SEARCH_PLUGIN_KEY = new PluginKey('search-and-replace')

interface TextNodesWithPosition {
  text: string;
  pos: number;
}

interface Range {
  from: number;
  to: number;
}

interface ProcessedSearches {
  decorationsToReturn: DecorationSet;
  results: Range[];
}

const getRegex = (s: string, disableRegex: boolean, caseSensitive: boolean) =>
  RegExp(disableRegex ? s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : s, caseSensitive ? 'gu' : 'gui')

function processSearches(
  doc: PMNode,
  searchTerm: RegExp,
  searchResultClass: string,
  resultIndex: number,
): ProcessedSearches {
  const decorations: Decoration[] = []
  let results: Range[] = []

  let textNodesWithPosition: TextNodesWithPosition[] = []
  let index = 0

  if (!searchTerm) {
    return {
      decorationsToReturn: DecorationSet.empty,
      results: [],
    }
  }

  doc.descendants((node, pos) => {
    if (node.isText) {
      textNodesWithPosition.push({ text: node.text!, pos })
    }
  })

  textNodesWithPosition.forEach(({ text, pos }) => {
    let match;
    while ((match = searchTerm.exec(text)) !== null) {
      const from = pos + match.index
      const to = from + match[0].length
      results.push({ from, to })
      decorations.push(Decoration.inline(from, to, { class: searchResultClass }))
    }
  })

  return {
    decorationsToReturn: DecorationSet.create(doc, decorations),
    results
  }
}

export const SearchAndReplaceExtension = (editor: BlockNoteEditor) => {
  return new Plugin({
    key: SEARCH_PLUGIN_KEY,
    state: {
      init() {
        return {
          searchTerm: '',
          results: [],
          resultIndex: 0,
        };
      },
      apply(tr, value) {
        const meta = tr.getMeta(SEARCH_PLUGIN_KEY)
        if (meta) {
          return { ...value, ...meta }
        }
        return value
      }
    },
    props: {
      decorations(state) {
        const { searchTerm, resultIndex } = SEARCH_PLUGIN_KEY.getState(state)
        const regex = getRegex(searchTerm, false, false)
        const { decorationsToReturn } = processSearches(state.doc, regex, 'search-result', resultIndex)
        return decorationsToReturn
      }
    },
    view(editorView) {
      return {
        update(view, prevState) {
          const { searchTerm, results, resultIndex } = SEARCH_PLUGIN_KEY.getState(view.state)
          if (results.length > 0) {
            const { from, to } = results[resultIndex]
            view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)))
            const { node } = view.domAtPos(from)
            if (node instanceof Element) {
              node.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
          }
        },
      };
    },
  });
}