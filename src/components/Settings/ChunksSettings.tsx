import React, { useState } from "react";
import { ChunkConfig } from "electron/main/Store/storeConfig";
import { Button } from "@material-tailwind/react";

const chunkOverlap = 20;


interface ChunkSettingsProps {}
const ChunksSettings: React.FC<ChunkSettingsProps> = () => {
  // Default chunksize to 500
  const [chunkSizeParams, setChunkSizeParams] = useState<ChunkConfig>();

  const [userHasMadeUpdate, setUserHasMadeUpdate] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Handle Save
  const handleSave = () => {
    // Execute the save function
    if (chunkSizeParams && chunkSizeParams?.chunkSize >= chunkOverlap
        && chunkSizeParams?.chunkSize < 2048) {
      setErrorMessage("")
      console.log(`Saving to electron: ${chunkSizeParams}`)
      window.electronStore.setChunkConfig(chunkSizeParams)
      setUserHasMadeUpdate(false);
    } else {
      setErrorMessage(`Chunk size must be between ${chunkOverlap} and 2047`);
    }
  };

  return (
    <div className="w-full bg-neutral-800 rounded pb-7 ">
      <h2 className="text-2x1 font-semibold mb-0 text-white">
        Chunk Size
      </h2>
      <p className="mt-2 text-sm text-gray-100 mb-1"> Set ChunkSize:</p>
      <input
        type="text"
        className="block w-full px-3 py-2 border border-gray-300 box-border rounded-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out"
        // value={chunkSizeParams?.chunkSize} 
        onChange={(e) => {
          setUserHasMadeUpdate(true);
          const inputVal = e.target.value;
          let newChunkSize;

          // If user has not inputted a value, set to undefined
          if (inputVal === "") {
            newChunkSize = 500;
          } else {
            // Set chunk size 
            const parsedValue = parseInt(inputVal, 10);
            if (!isNaN(parsedValue)) {
              newChunkSize = parsedValue;
            } else {
              // Non-empty invalid input
              // TODO: Display error message 
              return;
            }
          }

          setChunkSizeParams({chunkSize: newChunkSize});
        }}
      
        placeholder="Set maximum chunk size"
      />
      {errorMessage && (
        <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
      )}
      <p className="mt-1 text-xs text-gray-100 mb-0">
        Maximum size of chunks.
      </p>
      {userHasMadeUpdate && (
        <div className="flex">
          <Button
            placeholder={""}
            onClick={handleSave}
            className="bg-orange-700 w-[150px] border-none h-8 hover:bg-orange-900 cursor-pointer text-center pt- 0 pb-0 pr-2 pl-2 mb-0 mr-4 mt-2"
          >
            Save
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChunksSettings;
