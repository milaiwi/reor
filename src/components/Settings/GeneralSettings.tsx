import React from 'react'
import { AppearanceSection, EditorSection, SearchSection } from './GeneralSections'

/*
 *  General Page has the following format:
 *
 * SubHeader 1
 * =============
 *
 * OptionA for subheader
 * ----------------------
 * OptioNB for subheader
 * ---------------------
 *
 * SubHeader 2
 * =============
 *
 *
 * SubHeader describe the part of the project you are changing (appearance, editor, sidebar, etc..). Option(s) is the name of the specific change.
 */

const GeneralSettings = () => {
  return (
    <div className="w-full flex-col justify-between rounded bg-dark-gray-c-three">
      <h2 className="mb-0 text-2xl font-semibold text-white">General</h2>
      <AppearanceSection />
      <EditorSection />
      <SearchSection />
    </div>
  )
}

export default GeneralSettings
