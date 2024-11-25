import React, { useEffect, useRef, useCallback, useState } from 'react'
import { DBQueryResult } from 'electron/main/vector-database/schema'
import posthog from 'posthog-js'
import { DBSearchPreview } from '../File/DBResultPreview'
import debounce from './utils'
import { useWindowContentContext } from '@/contexts/WindowContentContext'

import { IconContext } from "react-icons";
import { CiSearch } from "react-icons/ci";


interface SearchComponentProps {
  queryType: string
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  queryType
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchResults, setSearchResults] = useState<DBQueryResult[]>([])
  const { openContent: openTabContent } = useWindowContentContext()
  const searchInputRef = useRef<HTMLInputElement>(null)
  

  const handleSearch = useCallback(
    async (query: string) => {
      const results: DBQueryResult[] = await window.database.search(query, 50, undefined, queryType)
      setSearchResults(results)
    },
    [setSearchResults],
  )

  const debouncedSearch = useCallback(
    (query: string) => {
      const debouncedFn = debounce(() => handleSearch(query), 300)
      debouncedFn()
    },
    [handleSearch],
  )

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery)
    }
  }, [searchQuery, debouncedSearch])

  const openFileSelectSearch = useCallback(
    (path: string) => {
      openTabContent(path)
      posthog.capture('open_file_from_search')
    },
    [openTabContent],
  )

  return (
    <div className="h-below-titlebar overflow-y-auto overflow-x-hidden p-1">
      <div className="relative mr-1 rounded bg-neutral-800 p-2 flex">
      <form className="flex items-center w-full">
        <div className="flex items-center bg-[#404040]/20 text-xs w-full h-8 border border-blue-600 rounded-md focus-within:border-gray-600 focus-within:ring-1 focus-within:ring-slate-500">
          <div className="ml-2 flex items-center">
            <IconContext.Provider value={{ size: '16px'}}>
              <CiSearch />
            </IconContext.Provider>
          </div>
          <input
            type="text"
            id="simple-search"
            className="h-8 bg-transparent text-xs block w-full p-2.5 focus:outline-none focus:ring-0 focus:border-gray-300 text-white/40 placeholder-gray-400 placeholder-opacity-40"
            placeholder="Search..."
            required
          />
        </div>
      </form>

      </div>
      <div className="mt-2 w-full">
        {searchResults.length > 0 && (
          <div className="w-full">
            {searchResults.map((result, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <DBSearchPreview key={index} dbResult={result} onSelect={openFileSelectSearch} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchComponent
