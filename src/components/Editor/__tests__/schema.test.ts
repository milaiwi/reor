import { describe, it, expect, vi } from 'vitest'
import { hmBlockSchema } from '../schema'

describe('HM Block Schema', () => {
  // beforeEach(() => {
  //   vi.doMock('@/lib/tiptap-extension-code-block', () => ({
  //     CodeBlockLowlight: {
  //       configure: vi.fn().mockReturnValue(CodeBlockLowlight),
  //     },
  //   }))
  // })

  it('should include all required block types', () => {
    expect(hmBlockSchema).toHaveProperty('paragraph')
    expect(hmBlockSchema).toHaveProperty('heading')
    expect(hmBlockSchema).toHaveProperty('bulletListItem')
    expect(hmBlockSchema).toHaveProperty('numberedListItem')
    expect(hmBlockSchema).toHaveProperty('image')
    expect(hmBlockSchema).toHaveProperty('code-block')
    expect(hmBlockSchema).toHaveProperty('video')
  })

  it('should have valid block configurations', () => {
    Object.entries(hmBlockSchema).forEach(([type, config]) => {
      expect(config).toHaveProperty('propSchema')
      expect(config).toHaveProperty('node')
    })
  })

  it('should have code-block with language configuration', () => {
    const codeBlock = hmBlockSchema['code-block']
    expect(codeBlock.propSchema).toHaveProperty('language')
    expect(codeBlock.propSchema.language.default).toBe('')
  })
})