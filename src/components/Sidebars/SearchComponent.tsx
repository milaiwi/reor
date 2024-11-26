import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { DBQueryResult } from 'electron/main/vector-database/schema'
import posthog from 'posthog-js'
import { IconContext } from 'react-icons'
import { CiSearch } from 'react-icons/ci'
import { DBSearchPreview } from '../File/DBResultPreview'
import debounce from './utils'
import { useWindowContentContext } from '@/contexts/WindowContentContext'

interface SearchComponentProps {
  queryType: string
}

const SearchComponent: React.FC<SearchComponentProps> = ({ queryType }) => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<DBQueryResult[]>([])
  const { openContent: openTabContent } = useWindowContentContext()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = useCallback(
    async (query: string) => {
      const results: DBQueryResult[] = await window.database.search(query, 50, undefined, queryType)
      setSearchResults(results)
    },
    [setSearchResults, queryType],
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
  }, [searchQuery, debouncedSearch, queryType])

  const openFileSelectSearch = useCallback(
    (path: string) => {
      openTabContent(path)
      posthog.capture('open_file_from_search')
    },
    [openTabContent],
  )

  const ciSearchMemo: { size: string } = useMemo(() => ({ size: '16px' }), [])

  return (
    <div className="h-below-titlebar overflow-y-auto overflow-x-hidden p-1">
      <div className="relative mr-1 flex rounded bg-neutral-800 p-2">
        <div className="flex h-8 w-full items-center rounded-md border border-blue-600 bg-[#404040]/20 text-xs focus-within:border-gray-600 focus-within:ring-1 focus-within:ring-slate-500">
          <div className="ml-2 flex items-center">
            <IconContext.Provider value={ciSearchMemo}>
              <CiSearch />
            </IconContext.Provider>
          </div>
          <input
            type="text"
            id="simple-search"
            className="block h-8 w-full bg-transparent p-2.5 text-xs text-white/40 placeholder:text-gray-400 placeholder:text-opacity-40 focus:border-gray-300 focus:outline-none focus:ring-0"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />
        </div>
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
