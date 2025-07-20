import React, { useState, useEffect } from 'react'
import { DBQueryResult } from 'electron/main/vector-database/schema'
import { Stack, Text } from '@mantine/core'
import { BlockNoteEditor, BlockSchema } from '@/lib/blocknote/core'
import { LinkToolbarPositionerProps } from '../LinkToolbarPositioner'
import { getUniqueSimilarFiles } from '@/lib/semanticService'
import ThemedMenu, { ThemedDropdown, ThemedMenuItem } from '@/components/ui/ThemedMenu'
import Spinner from '@/components/ui/Spinner'

const LinkToolbarContent = <BSchema extends BlockSchema>(
  props: LinkToolbarPositionerProps<BSchema> & {
    editor: BlockNoteEditor<BSchema>
  },
) => {
  const [similarFiles, setSimilarFiles] = useState<DBQueryResult[]>([])
  const [loading, setLoading] = useState(true)
  const [triggerRender, setTriggerRender] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTriggerRender((prev) => prev + 1)
    }, 100)

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const fetchSimilarFiles = async () => {
      if (!props.editor.currentFilePath) return
      try {
        const files = await getUniqueSimilarFiles(props.editor.currentFilePath, 5)
        setSimilarFiles(files)
      } finally {
        setLoading(false)
      }
    }

    fetchSimilarFiles()
  }, [props.editor.currentFilePath, triggerRender])

  if (loading) {
    return (
      <div className="bg-gray-200 p-2 gap-1 rounded-md border border-gray-300 shadow-sm dark:bg-gray-800 dark:border-gray-600">
        <div className="flex items-center gap-2 p-2">
          <Spinner size="small" />
          <p className="text-sm text-left">
            Loading similar files...
          </p>
        </div>
      </div>
    )
  }

  /**
   * Cannot use Menu or Popover because we have some async behavior.
   * When I tried to use an external library it would introduce many bugs
   */
  return (
    <ThemedMenu defaultOpened closeDelay={10000000} opened closeOnClickOutside>
      <ThemedDropdown onMouseDown={(e) => e.preventDefault()}>
        {similarFiles.slice(0, 5).map((file) => (
          <ThemedMenuItem key={file.notepath} onClick={() => props.editor.addLink(file.notepath, file.name)}>
            <Stack spacing={0} w={250}>
              <Text>{file.name}</Text>
              <Text size={10} truncate>
                {file.notepath}
              </Text>
            </Stack>
          </ThemedMenuItem>
        ))}
      </ThemedDropdown>
    </ThemedMenu>
  )
}

export default LinkToolbarContent
