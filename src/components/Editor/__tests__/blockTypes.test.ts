import { describe, it, expect } from 'vitest'
import { Node } from '@tiptap/core'
import { Block, PropSchema, BlockSpec } from '@/lib/blocknote'

describe('Block Types', () => {
  describe('PropSchema', () => {
    it('should define valid prop schemas', () => {
      const schema: PropSchema = {
        color: {
          values: ['red', 'blue', 'green'],
          default: 'red',
        },
        size: {
          default: 'medium',
        },
      }

      expect(schema.color.values).toEqual(['red', 'blue', 'green'])
      expect(schema.color.default).toBe('red')
      expect(schema.size.default).toBe('medium')
    })
  })

  describe('BlockSpec', () => {
    it('should create valid block specs', () => {
      const spec: BlockSpec<'paragraph', { color: { default: string } }> = {
        propSchema: {
          color: { default: 'black' },
        },
        // @ts-ignore
        node: {} as Node,
      }

      expect(spec.propSchema).toBeDefined()
      expect(spec.node).toBeDefined()
    })
  })

  describe('Block', () => {
    it('should create valid blocks with children', () => {
      const block: Block = {
        id: '1',
        type: 'paragraph',
        // @ts-ignore
        props: {},
        content: [],
        children: [],
      }

      expect(block.id).toBe('1')
      expect(block.type).toBe('paragraph')
      expect(Array.isArray(block.children)).toBe(true)
    })
  })
})