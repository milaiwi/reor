// src/components/Editor/__tests__/BlockNoteEditor.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { hmBlockSchema, HMBlockSchema } from '@/components/Editor/schema'
import { useBlockNote, BlockNoteEditor } from '@/lib/blocknote'
import { renderHook } from '@testing-library/react'

describe('BlockNoteEditor', () => {
  let editor: BlockNoteEditor<HMBlockSchema>
  let parentElement: HTMLElement

  beforeEach(() => {
    parentElement = document.createElement('div')
    // Use renderHook to test the hook
    const { result } = renderHook(() => useBlockNote({
      parentElement,
      blockSchema: hmBlockSchema,
      editable: true,
      onEditorReady: (editor) => {
        // Set initial content after editor is ready
        editor.insertBlocks([{
          type: 'paragraph',
          id: 'initialBlockId',
          content: [{
            type: 'text',
            text: '',
            styles: {}
          }]
        }], 'initialBlockId', 'after')
      }
    }))
    editor = result.current
  })

  afterEach(() => {
    if (editor._tiptapEditor) {
      editor._tiptapEditor.destroy()
    }
  })



  describe('Basic Editor Functionality', () => {
    it('should create editor instance', () => {
      expect(editor).toBeDefined()
      expect(editor._tiptapEditor).toBeDefined()
    })

    it('should have correct schema', () => {
      expect(editor.schema).toBe(hmBlockSchema)
    })

    it('should be editable by default', () => {
      expect(editor.isEditable).toBe(true)
    })
  })

  describe('Block Operations', () => {
    const mockBlock = {
      id: 'test-id-1',
      type: 'paragraph',
      props: {
        type: 'p'
      },
      content: [{
        type: 'text' as const,
        text: 'Test content',
        styles: {}
      }],
      children: []
    }
    
    const mockBlock2 = {
      id: 'test-id-2',
      type: 'paragraph',
      props: {},
      content: [],
      children: [],
    }

    describe('Block Manipulation', async () => {
      it.only('should insert blocks', async () => {
        // Wait for editor to be ready
        await new Promise<void>((resolve) => {
          const checkReady = () => {
            console.log('Checking editor ready state:', editor.ready)
            if (editor.ready) {
              resolve()
            } else {
              setTimeout(checkReady, 500)
            }
          }
          checkReady()
        })

        console.log('Editor is ready, proceeding with block insertion')
        
        // Insert the block
        editor.insertBlocks([mockBlock], 'initialBlockId', 'after')

        // Get the inserted block
        const insertedBlock = editor.getBlock('test-id-1')
        
        // Verify the block was inserted correctly
        expect(insertedBlock).toBeDefined()
        expect(insertedBlock?.id).toBe('test-id-1')
        expect(insertedBlock?.type).toBe('paragraph')
        expect(insertedBlock?.props.type).toBe('p')
        expect((insertedBlock?.content[0] as { text: string }).text).toBe('Test content')
      }, 30000)

      it('should update block', () => {
        const updatedBlock = {
          ...mockBlock,
          props: { text: 'Updated text' },
        }

        expect(() => {
          editor.updateBlock('test-id-1', updatedBlock)
        }).not.toThrow()
      })

      it('should remove blocks', () => {
        expect(() => {
          editor.removeBlocks(['test-id-1'])
        }).not.toThrow()
      })

      it('should replace blocks', () => {
        expect(() => {
          editor.replaceBlocks(['test-id-1'], [mockBlock2])
        }).not.toThrow()
      })

      it('should get block by identifier', () => {
        const block = editor.getBlock('test-id-1')
        expect(block).toBeDefined()
      })

      it('should get top level blocks', () => {
        const blocks = editor.topLevelBlocks
        expect(Array.isArray(blocks)).toBe(true)
      })
    })

    describe('Block Navigation', () => {
      it('should check if block can be nested', () => {
        const canNest = editor.canNestBlock()
        expect(typeof canNest).toBe('boolean')
      })

      it('should nest block', () => {
        expect(() => {
          editor.nestBlock()
        }).not.toThrow()
      })

      it('should check if block can be unnested', () => {
        const canUnnest = editor.canUnnestBlock()
        expect(typeof canUnnest).toBe('boolean')
      })

      it('should unnest block', () => {
        expect(() => {
          editor.unnestBlock()
        }).not.toThrow()
      })

      it('should traverse blocks with forEachBlock', () => {
        const visitedBlocks: string[] = []
        
        editor.forEachBlock((block) => {
          visitedBlocks.push(block.id)
          return true // continue traversal
        })

        expect(Array.isArray(visitedBlocks)).toBe(true)
      })

      it('should stop traversal when callback returns false', () => {
        const visitedBlocks: string[] = []
        
        editor.forEachBlock((block) => {
          visitedBlocks.push(block.id)
          return false // stop traversal
        })

        expect(visitedBlocks.length).toBeLessThanOrEqual(1)
      })
    })
  })
})