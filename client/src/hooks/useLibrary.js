import { createContext, useContext } from 'react'

export const LibraryContext = createContext(null)

function useLibrary() {
  return useContext(LibraryContext)
}

export default useLibrary
