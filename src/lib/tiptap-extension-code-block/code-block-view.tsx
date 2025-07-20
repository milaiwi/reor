/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { NodeViewProps } from '@tiptap/core'
import { NodeViewContent } from '@tiptap/react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

const languages = [
  'Arduino',
  'Bash',
  'C',
  'CPP',
  'Csharp',
  'Css',
  'Diff',
  'Go',
  'Graphql',
  'Ini',
  'Java',
  'javascript',
  'Json',
  'Kotlin',
  'Less',
  'Lua',
  'Makefile',
  'Markdown',
  'Objectivec',
  'Perl',
  'Php',
  'Php-template',
  'Plaintext',
  'Python',
  'Python-repl',
  'R',
  'Ruby',
  'Rust',
  'Scss',
  'Shell',
  'Sql',
  'Swift',
  'Typescript',
  'Vbnet',
  'Wasm',
  'XML',
  'YAML',
]

const CodeBlockView = ({ props }: { props: NodeViewProps }) => {
  const { node, updateAttributes } = props
  const [hovered, setHovered] = useState(false)
  const [language, setLanguage] = useState(node.attrs.language ? node.attrs.language : 'Plaintext')
  const [popoverOpen, setPopoverOpen] = useState(false)

  const handleChange = (newLanguage: string) => {
    updateAttributes({ language: newLanguage })
    setLanguage(newLanguage)
    setPopoverOpen(false)
  }

  const customLanguageClass = `language-${language}`
  return (
    <div 
      className="relative"
      onMouseEnter={() => setHovered(true)} 
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`absolute top-6 right-0 z-50 flex items-center justify-end gap-4 opacity-0 pointer-events-none transition-opacity ${
          hovered ? 'opacity-100 pointer-events-auto' : ''
        }`}
        contentEditable={false}
      >
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              onClick={() => setPopoverOpen(!popoverOpen)}
              size="sm"
              variant="ghost"
              className="h-5 text-xs text-gray-600 bg-transparent"
            >
              {language} <ChevronDown className="text-gray-600" size={12} />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="p-0">
            <div className="rounded-md bg-white border border-gray-300">
              {/* List of selectable items */}
              <div className="max-h-[200px] overflow-y-auto p-2">
                {languages.map((lang) => (
                  <div
                    key={lang}
                    className="flex items-center justify-between p-2 cursor-pointer w-50 rounded-md hover:bg-gray-100"
                    onClick={() => handleChange(lang)}
                  >
                    <span className="text-xs">{lang}</span>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <pre>
        <code className={customLanguageClass}>
          <NodeViewContent />
        </code>
      </pre>
    </div>
  )
}

export default CodeBlockView
