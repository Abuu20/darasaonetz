import { useEffect, useRef } from 'react'

export const useClickOutside = (handler) => {
  const ref = useRef()

  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return
      }
      handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [handler])

  return ref
}

// Hook for multiple refs
export const useClickOutsideMulti = (handler) => {
  const refs = useRef([])

  useEffect(() => {
    const listener = (event) => {
      const isOutside = refs.current.every(ref => 
        !ref || !ref.contains(event.target)
      )
      
      if (isOutside) {
        handler(event)
      }
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [handler])

  return refs
}
