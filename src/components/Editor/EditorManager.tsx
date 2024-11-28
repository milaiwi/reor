import React, { useEffect, useState } from 'react'
import { BlockNoteView } from '@blocknote/mantine'
import InEditorBacklinkSuggestionsDisplay from './BacklinkSuggestionsDisplay'
import { useFileContext } from '@/contexts/FileContext'
import { useContentContext } from '@/contexts/ContentContext'

const EditorManager: React.FC = () => {
  // const [showSearchBar, setShowSearchBar] = useState(false)
  // const [contextMenuVisible, setContextMenuVisible] = useState(false)
  // const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [editorFlex, setEditorFlex] = useState(true)

  const { editor, suggestionsState, vaultFilesFlattened, saveCurrentlyOpenedFile } = useFileContext()
  const [showDocumentStats, setShowDocumentStats] = useState(false)
  const { openContent } = useContentContext()

  // const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
  //   event.preventDefault()
  //   setMenuPosition({
  //     x: event.pageX,
  //     y: event.pageY,
  //   })
  //   setContextMenuVisible(true)
  // }

  // const hideMenu = () => {
  //   if (contextMenuVisible) setContextMenuVisible(false)
  // }

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
    <div
      className="relative size-full cursor-text overflow-hidden bg-bn-colors-menu-background py-4 text-slate-400 text-white"
      onClick={() => editor?.focus()}
    >
      <div
        className={`relative h-full ${showDocumentStats ? 'pb-3' : ''}`}
      >
        <div className={`relative size-full overflow-y-auto ${editorFlex ? 'flex justify-center py-2' : ''}`}>
          <BlockNoteView
            className={`relative size-full  ${editorFlex ? 'max-w-3xl' : ''}`}
            style={{
              wordBreak: 'break-word',
            }}
            onClick={handleClick}
            editor={editor!}
          />
        </div>
      </div>
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
    </div>
  )
}

export default EditorManager
