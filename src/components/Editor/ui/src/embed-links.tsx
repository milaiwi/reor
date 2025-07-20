import React, { useState } from 'react'
import { IconType } from 'react-icons'
import { MediaType } from '@/components/Editor/types/media-render'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface EmbedRenderProps {
  props: {
    mediaType: string
    icon?: IconType
    hint?: string
    uploadOptionHint?: string
    embedPlaceholder?: string
    embedOptionHint?: string
  }
  submit?: (
    assignMedia: (props: MediaType) => void,
    queryType: string,
    url?: string,
    setFileName?: any,
  ) => Promise<void>
  assign: (props: MediaType) => void
}

const EmbedComponent: React.FC<EmbedRenderProps> = ({ props, submit, assign }) => {
  // eslint-disable-next-line react/prop-types
  const { mediaType, icon, hint, uploadOptionHint, embedPlaceholder, embedOptionHint } = props
  const [url, setURL] = useState('')
  const [isClicked, setIsClicked] = useState(false)
  const [selectedOption, setSelectedOption] = useState('upload')
  const [errorRaised, setErrorRaised] = useState('')

  const handleClick = () => setIsClicked(!isClicked)

  return (
    <Popover onOpenChange={() => setErrorRaised('')}>
      <PopoverTrigger asChild>
        <div
          className="relative border-0 bg-purple-100 rounded-md outline-none cursor-pointer h-[50px] hover:bg-purple-200 transition-colors"
          contentEditable={false}
          onClick={handleClick}
        >
          <div className="flex items-center justify-start rounded h-full pl-2.5 gap-2 opacity-40">
            {icon && React.createElement(icon)}
            <span className="text-sm font-mono">
              {hint}
            </span>
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-3">
        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={selectedOption === 'upload' ? 'default' : 'outline'}
              onClick={() => {
                setSelectedOption('upload')
                setIsClicked(false)
                setErrorRaised('')
              }}
              className="rounded-none hover:rounded-md font-medium"
            >
              Upload
            </Button>
            {mediaType === 'image' && (
              <Button
                size="sm"
                variant={selectedOption === 'embed' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedOption('embed')
                  setIsClicked(false)
                  setErrorRaised('')
                }}
                className="rounded-none hover:rounded-md font-medium"
              >
                Embed
              </Button>
            )}
          </div>

          <div className="h-px bg-gray-200" />

          {selectedOption === 'upload' ? (
            <div className="flex flex-col gap-3 pt-3">
              <Button
                className="h-9 text-gray-700 bg-gray-100 hover:bg-gray-200 font-mono p-4 rounded-md cursor-pointer"
                onClick={() => {
                  if (submit) {
                    submit(assign, 'upload', undefined, setErrorRaised)
                  }
                  setErrorRaised('')
                }}
              >
                {uploadOptionHint}
              </Button>
            </div>
          ) : (
            mediaType === 'image' && (
              <div className="flex flex-col gap-2">
                <Input
                  autoFocus
                  className={`h-8 font-mono bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-blue-700 focus:outline-2 focus:outline ${errorRaised ? 'bg-red-500' : ''}`}
                  placeholder={embedPlaceholder}
                  value={url}
                  onChange={(e) => setURL(e.target.value)}
                />
                {errorRaised && (
                  <p className="text-sm text-red-500 font-semibold">
                    {errorRaised}
                  </p>
                )}
                <div className="flex justify-center">
                  <Button
                    className="w-1/2 h-9 text-white font-mono p-4 bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer"
                    onClick={() => {
                      if (submit) {
                        submit(assign, 'embed', url, setErrorRaised)
                      }
                      setURL('')
                    }}
                  >
                    {embedOptionHint}
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default EmbedComponent
