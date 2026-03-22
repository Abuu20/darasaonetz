import { useEffect, useRef, useState } from 'react'

export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState(null)
  const elementRef = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
      setEntry(entry)
    }, options)

    const currentElement = elementRef.current
    if (currentElement) {
      observer.observe(currentElement)
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement)
      }
    }
  }, [options])

  return [elementRef, isIntersecting, entry]
}

// Hook for lazy loading
export const useLazyLoad = (options = {}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    ...options
  })

  useEffect(() => {
    if (isIntersecting && !isLoaded) {
      setIsLoaded(true)
    }
  }, [isIntersecting, isLoaded])

  return [ref, isLoaded]
}

// Hook for infinite scrolling
export const useInfiniteScroll = (callback, options = {}) => {
  const [isFetching, setIsFetching] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    ...options
  })

  useEffect(() => {
    if (isIntersecting && hasMore && !isFetching) {
      setIsFetching(true)
      
      callback().then((moreAvailable) => {
        setIsFetching(false)
        setHasMore(moreAvailable)
      })
    }
  }, [isIntersecting, hasMore, isFetching, callback])

  return [ref, isFetching, hasMore]
}
