/* eslint-disable react/no-array-index-key */
import React, { useEffect, useRef, useCallback, useState } from 'react'
import { DBQueryResult } from 'electron/main/vector-database/schema'
import posthog from 'posthog-js'
import { debounce } from 'lodash'
import { Search, Filter, FilterX } from 'lucide-react'
import { SearchProps as SearchParamsType } from 'electron/main/electron-store/types'
import DBSearchPreview from '../File/DBResultPreview'
import { useContentContext } from '@/contexts/ContentContext'
import { hybridSearch } from '@/lib/db'
import { ToggleButton, ToggleThumb } from '@/components/Editor/ui/src/toggle'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

interface SearchComponentProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: DBQueryResult[]
  setSearchResults: (results: DBQueryResult[]) => void
}

export type SearchModeTypes = 'vector' | 'hybrid'

// Custom toggle component
const ToggleSwitch: React.FC<{
  isHybrid: boolean
  onChange: (searchMode: SearchModeTypes) => void
  className?: string
  label: string
}> = ({ isHybrid, onChange, className = '', label }) => (
  <ToggleButton
    hybrid={isHybrid}
    className={className}
    onPress={() => onChange(isHybrid ? 'vector' : 'hybrid')}
    aria-checked={isHybrid}
    role="switch"
    aria-label={label}
  >
    <ToggleThumb hybrid={isHybrid} />
  </ToggleButton>
)

const SearchComponent: React.FC<SearchComponentProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
}) => {
  const { openContent: openTabContent } = useContentContext()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchParams, setSearchParams] = useState<SearchParamsType>({
    searchMode: 'vector',
    vectorWeight: 0.7,
  })
  const [showSearchOptions, setShowSearchOptions] = useState(false)

  useEffect(() => {
    const fetchSearchMode = async () => {
      const storedParams = await window.electronStore.getSearchParams()
      if (storedParams) setSearchParams(storedParams)
    }
    fetchSearchMode()
  }, [])

  useEffect(() => {
    window.electronStore.setSearchParams(searchParams)
  }, [searchParams])

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        return
      }

      if (searchParams.searchMode === 'hybrid') {
        const results = await hybridSearch(query, 50, undefined, searchParams.vectorWeight)
        setSearchResults(results)
      } else {
        const results: DBQueryResult[] = await window.database.search(query, 50)
        setSearchResults(results)
      }
    },
    [setSearchResults, searchParams.searchMode, searchParams.vectorWeight],
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
  }, [searchParams.searchMode, searchParams.vectorWeight, debouncedSearch, searchQuery])

  const openFileSelectSearch = useCallback(
    (path: string) => {
      openTabContent(path)
      posthog.capture('open_file_from_search')
    },
    [openTabContent],
  )

  const handleVectorWeightChange = (value: number[]) => {
    setSearchParams((prev) => ({
      ...prev,
      vectorWeight: value[0],
    }))
  }

  return (
    <div className="overflow-y-auto">
      <div className="p-1">
        <div className="relative mr-1 rounded-md p-2">
          <div className="absolute left-0 top-3.5 flex items-center pl-3">
            <Search size={14} className="text-gray-600" />
          </div>
          <Input
            ref={searchInputRef}
            className="w-full h-8 pl-5 rounded-md bg-gray-100 text-gray-600 border border-gray-600 focus:border-gray-600 focus:outline-none text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchParams.searchMode === 'hybrid' ? 'Search Hybrid...' : 'Search Vector...'}
          />
          <div
            className="absolute right-4 top-3.5 flex items-center bg-transparent focus:outline-none cursor-pointer"
            onClick={() => setShowSearchOptions(!showSearchOptions)}
            aria-label="Search options"
          >
            {showSearchOptions ? <FilterX className="text-gray-500" size={14} /> : <Filter className="text-gray-500" size={14} />}
          </div>
        </div>

        {showSearchOptions && (
          <div className="max-h-[100px] animate-slide-down">
            <div className="mt-2 rounded-md border border-gray-600 p-3 mx-10 shadow-sm bg-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Hybrid Search
                </p>
                <ToggleSwitch
                  isHybrid={searchParams.searchMode === 'hybrid'}
                  onChange={(mode) => setSearchParams((prev) => ({ ...prev, searchMode: mode }))}
                  label="Hybrid Search"
                />
              </div>

              {searchParams.searchMode === 'hybrid' && (
                <div className="mt-3 animate-slide-down overflow-hidden">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Search Balance
                    </p>
                    <p className="text-sm px-2 py-1 rounded">
                      {Math.round(searchParams.vectorWeight * 100)}% Semantic -{' '}
                      {Math.round((1 - searchParams.vectorWeight) * 100)}% Keywords
                    </p>
                  </div>
                  <div className="relative px-5">
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={[searchParams.vectorWeight]}
                      onValueChange={handleVectorWeightChange}
                      className="w-full"
                      aria-label="Search balance slider"
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between">
                    <p className="text-sm text-gray-500">
                      Keywords
                    </p>
                    <p className="text-sm text-gray-500">
                      Balanced
                    </p>
                    <p className="text-sm text-gray-500">
                      Semantic
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 w-full px-3">
            {searchResults.map((result, index) => (
              <DBSearchPreview key={index} dbResult={result} onSelect={openFileSelectSearch} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchComponent
