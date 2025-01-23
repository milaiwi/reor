import React, { useEffect, useState } from 'react'
import { EditorContent } from '@tiptap/react'
import InEditorBacklinkSuggestionsDisplay from './BacklinkSuggestionsDisplay'
import EditorContextMenu from './EditorContextMenu'
import SearchBar from './Search/SearchBar'
import { useFileContext } from '@/contexts/FileContext'
import { useContentContext } from '@/contexts/ContentContext'
import { BlockNoteView, FormattingToolbarPositioner, SlashMenuPositioner } from '@/lib/blocknote'
import { XStack, YStack } from 'tamagui'

const EditorManager: React.FC = () => {
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [editorFlex, setEditorFlex] = useState(true)

  const { editor, suggestionsState, vaultFilesFlattened } = useFileContext()
  const [showDocumentStats, setShowDocumentStats] = useState(false)
  const { openContent } = useContentContext()

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    setMenuPosition({
      x: event.pageX,
      y: event.pageY,
    })
    setContextMenuVisible(true)
  }

  const hideMenu = () => {
    if (contextMenuVisible) setContextMenuVisible(false)
  }

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const { target } = event
    if (target instanceof HTMLElement && target.getAttribute('data-backlink') === 'true') {
      event.preventDefault()
      const backlinkPath = target.textContent
      if (backlinkPath) openContent(backlinkPath)
    }
  }

  useEffect(() => {
    const initEditorContentCenter = async () => {
      const isCenter = await window.electronStore.getEditorFlexCenter()
      setEditorFlex(isCenter)
    }

    const handleEditorChange = (event: any, editorFlexCenter: boolean) => {
      setEditorFlex(editorFlexCenter)
    }

    initEditorContentCenter()
    window.ipcRenderer.on('editor-flex-center-changed', handleEditorChange)
  }, [])

  useEffect(() => {
    const initDocumentStats = async () => {
      const showStats = await window.electronStore.getDocumentStats()
      setShowDocumentStats(showStats)
    }

    initDocumentStats()

    const handleDocStatsChange = (event: Electron.IpcRendererEvent, value: boolean) => {
      setShowDocumentStats(value)
    }

    window.ipcRenderer.on('show-doc-stats-changed', handleDocStatsChange)
  }, [])

  return (
    <YStack
      backgroundColor="$editorbg11"
      className="relative size-full cursor-text overflow-hidden py-4 "
      onClick={() => editor?.focus()}
    >
      {/* <SearchBar editor={editor} showSearch={showSearchBar} setShowSearch={setShowSearchBar} /> */}
      {/* {contextMenuVisible && (
        <EditorContextMenu
          editor={editor}
          menuPosition={menuPosition}
          setMenuVisible={setContextMenuVisible}
          hideMenu={hideMenu}
        />
      )} */}

      <YStack
        className={`py-4 relative h-full overflow-y-auto ${editorFlex ? 'flex justify-center px-24' : 'px-12'} ${showDocumentStats ? 'pb-3' : ''}`}
      >
        <YStack className="relative size-full ">
          {editor && (
            <BlockNoteView editor={editor} >
              <FormattingToolbarPositioner editor={editor} />
              <SlashMenuPositioner editor={editor} />
            </BlockNoteView>
          )}
        </YStack>
      </YStack>
      {suggestionsState && (
        <InEditorBacklinkSuggestionsDisplay
          suggestionsState={suggestionsState}
          suggestions={vaultFilesFlattened.map((file) => file.relativePath)}
        />
      )}
      {/* {editor && showDocumentStats && (
        <div className="absolute bottom-2 right-2 flex gap-4 text-sm text-gray-500">
          <div>Characters: {editor.storage.characterCount.characters()}</div>
          <div>Words: {editor.storage.characterCount.words()}</div>
        </div>
      )} */}
    </YStack>
  )
}

export default EditorManager
