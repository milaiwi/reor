import React, { useEffect, useState } from 'react'

import posthog from 'posthog-js'

import '../styles/global.css'
import ChatWithLLM from './Chat/Chat'
import { useChatHistory } from './Chat/hooks/use-chat-history'
import ResizableComponent from './Common/ResizableComponent'
import TitleBar from './Common/TitleBar'
import EditorManager from './Editor/EditorManager'
import useFileInfoTree from './File/FileSideBar/hooks/use-file-info-tree'
import useFileByFilepath from './File/hooks/use-file-by-filepath'
import IconsSidebar from './Sidebars/IconsSidebar'
import SidebarManager, { SidebarAbleToShow } from './Sidebars/MainSidebar'
import SimilarFilesSidebarComponent from './Sidebars/SimilarFilesSidebar'
import WritingAssistant from './Writing-Assistant/WritingAssistantFloatingMenu'
import { ChatFilters, ChatHistory } from './Chat/chatUtils'
import EmptyPage from './EmptyPage'
import { TabProvider } from './Providers/TabProvider'

const MainPageComponent: React.FC = () => {
  const [showChatbot, setShowChatbot] = useState<boolean>(false)
  const [showSimilarFiles, setShowSimilarFiles] = useState(true)
  const [sidebarShowing, setSidebarShowing] = useState<SidebarAbleToShow>('files')

  const {
    filePath,
    setFilePath,
    editor,
    openFileByPath,
    openRelativePath,
    saveCurrentlyOpenedFile,
    suggestionsState,
    highlightData,
    noteToBeRenamed,
    setNoteToBeRenamed,
    fileDirToBeRenamed,
    setFileDirToBeRenamed,
    renameFile,
    navigationHistory,
    setNavigationHistory,
  } = useFileByFilepath()

  const { currentChatHistory, setCurrentChatHistory, chatHistoriesMetadata } = useChatHistory()

  const { files, flattenedFiles, expandedDirectories, handleDirectoryToggle } = useFileInfoTree(filePath)

  const toggleSimilarFiles = () => {
    setShowSimilarFiles(!showSimilarFiles)
  }

  const openFileAndOpenEditor = async (path: string) => {
    setShowChatbot(false)
    openFileByPath(path)
  }

  const openChatAndOpenChat = (chatHistory: ChatHistory | undefined) => {
    setShowChatbot(true)
    setCurrentChatHistory(chatHistory)
  }

  const [vaultDirectory, setVaultDirectory] = useState<string>('')
  const [chatFilters, setChatFilters] = useState<ChatFilters>({
    files: [],
    numberOfChunksToFetch: 15,
    minDate: new Date(0),
    maxDate: new Date(),
  })

  const [sidebarWidth, setSidebarWidth] = useState<number>(40)
  const [resizableWidth, setResizableWidth] = useState<number>(300)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const handleResize = (size: number) => {
    setResizableWidth(size)
  }

  // find all available files
  useEffect(() => {
    const updateWidth = async () => {
      const isCompact = await window.electronStore.getSBCompact()
      setSidebarWidth(isCompact ? 40 : 60)
    }

    // Listen for changes on settings
    const handleSettingsChange = (isCompact: number) => {
      setSidebarWidth(isCompact ? 40 : 60)
    }

    const setFileDirectory = async () => {
      const windowDirectory = await window.electronStore.getVaultDirectoryForWindow()
      setVaultDirectory(windowDirectory)
    }
    setFileDirectory()
    updateWidth()

    window.ipcRenderer.receive('sb-compact-changed', handleSettingsChange)
  }, [])

  useEffect(() => {
    const handleAddFileToChatFilters = (file: string) => {
      setSidebarShowing('chats')
      setShowChatbot(true)
      // setFileIsOpen(false);
      setCurrentChatHistory(undefined)
      setChatFilters((prevChatFilters) => ({
        ...prevChatFilters,
        files: [...prevChatFilters.files, file],
      }))
    }
    const removeAddChatToFileListener = window.ipcRenderer.receive('add-file-to-chat-listener', (noteName: string) => {
      handleAddFileToChatFilters(noteName)
    })

    return () => {
      removeAddChatToFileListener()
    }
  }, [setCurrentChatHistory, setChatFilters])

  return (
    <div>
      {/* Displays the dropdown tab when hovering. You cannot use z-index and position absolute inside 
          TitleBar since one of the Parent components inadvertently creates a new stacking context that 
          impacts the z-index. */}
      <div id="tooltip-container" />
      <TabProvider openFileAndOpenEditor={openFileAndOpenEditor} setFilePath={setFilePath} currentFilePath={filePath}>
        <TitleBar
          history={navigationHistory}
          setHistory={setNavigationHistory}
          currentFilePath={filePath}
          onFileSelect={openFileAndOpenEditor}
          similarFilesOpen={showSimilarFiles} // This might need to be managed differently now
          toggleSimilarFiles={toggleSimilarFiles} // This might need to be managed differently now
          openFileAndOpenEditor={openFileAndOpenEditor}
          sidebarWidth={resizableWidth}
        />
      </TabProvider>

      <div className="flex h-below-titlebar">
        <div
          className="border-y-0 border-l-0 border-r-[0.001px] border-solid border-neutral-700 pt-2.5"
          style={{ width: `${sidebarWidth}px` }}
        >
          <IconsSidebar
            openRelativePath={openRelativePath}
            sidebarShowing={sidebarShowing}
            makeSidebarShow={setSidebarShowing}
          />
        </div>

        <ResizableComponent resizeSide="right" onResize={handleResize} isSidebarOpen={isSidebarOpen}>
          <div className="w-[160px] border-y-0 border-l-0 border-r-[0.001px] border-solid border-neutral-700">
            <SidebarManager
              files={files}
              expandedDirectories={expandedDirectories}
              handleDirectoryToggle={handleDirectoryToggle}
              selectedFilePath={filePath}
              onFileSelect={openFileAndOpenEditor}
              sidebarShowing={sidebarShowing}
              renameFile={renameFile}
              noteToBeRenamed={noteToBeRenamed}
              setNoteToBeRenamed={setNoteToBeRenamed}
              fileDirToBeRenamed={fileDirToBeRenamed}
              setFileDirToBeRenamed={setFileDirToBeRenamed}
              currentChatHistory={currentChatHistory}
              chatHistoriesMetadata={chatHistoriesMetadata}
              setCurrentChatHistory={openChatAndOpenChat}
              setChatFilters={setChatFilters}
              setShowChatbot={setShowChatbot}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
            />
          </div>
        </ResizableComponent>

        {!showChatbot && filePath ? (
          <div className="relative flex size-full overflow-hidden">
            <div className="h-full grow overflow-hidden">
              <EditorManager
                editor={editor}
                suggestionsState={suggestionsState}
                flattenedFiles={flattenedFiles}
                showSimilarFiles={showSimilarFiles}
              />{' '}
            </div>
            <WritingAssistant
              editor={editor}
              highlightData={highlightData}
              currentChatHistory={currentChatHistory}
              setCurrentChatHistory={setCurrentChatHistory}
            />
            {showSimilarFiles && (
              <div className="h-full shrink-0 overflow-y-auto overflow-x-hidden">
                <SimilarFilesSidebarComponent
                  filePath={filePath}
                  highlightData={highlightData}
                  openFileByPath={openFileByPath}
                  saveCurrentlyOpenedFile={saveCurrentlyOpenedFile}
                />
              </div>
            )}
          </div>
        ) : (
          !showChatbot && (
            <div className="relative flex size-full overflow-hidden">
              <EmptyPage vaultDirectory={vaultDirectory} />
            </div>
          )
        )}

        {showChatbot && (
          <div className="h-below-titlebar w-full">
            <ChatWithLLM
              vaultDirectory={vaultDirectory}
              openFileByPath={openFileAndOpenEditor}
              currentChatHistory={currentChatHistory}
              setCurrentChatHistory={setCurrentChatHistory}
              showSimilarFiles={showSimilarFiles} // This might need to be managed differently now
              chatFilters={chatFilters}
              setChatFilters={(updatedChatFilters: ChatFilters) => {
                posthog.capture('add_file_to_chat', {
                  chatFilesLength: updatedChatFilters.files.length,
                })
                setChatFilters(updatedChatFilters)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default MainPageComponent
