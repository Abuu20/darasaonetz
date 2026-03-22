import { useState, useEffect } from 'react'

// Debounce a value
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Debounce a function
export const useDebouncedCallback = (callback, delay = 500, deps = []) => {
  const [timeoutId, setTimeoutId] = useState(null)

  const debouncedCallback = useCallback((...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const id = setTimeout(() => {
      callback(...args)
    }, delay)

    setTimeoutId(id)
  }, [callback, delay, ...deps])

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  return debouncedCallback
}

// Hook for debounced search
export const useDebouncedSearch = (searchFunction, delay = 500) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const debouncedSearch = useDebouncedCallback(async (term) => {
    if (!term) {
      setResults([])
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await searchFunction(term)
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, delay)
  
  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])
  
  return {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    error
  }
}

// Hook for debounced form validation
export const useDebouncedValidation = (values, validate, delay = 500) => {
  const [errors, setErrors] = useState({})
  const [isValidating, setIsValidating] = useState(false)
  
  const debouncedValidate = useDebouncedCallback(async (vals) => {
    setIsValidating(true)
    try {
      const validationErrors = await validate(vals)
      setErrors(validationErrors)
    } catch (err) {
      console.error('Validation error:', err)
    } finally {
      setIsValidating(false)
    }
  }, delay)
  
  useEffect(() => {
    debouncedValidate(values)
  }, [values, debouncedValidate])
  
  return {
    errors,
    isValidating,
    isValid: Object.keys(errors).length === 0
  }
}

// Hook for debounced save
export const useDebouncedSave = (data, saveFunction, delay = 1000) => {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [error, setError] = useState(null)
  
  const debouncedSave = useDebouncedCallback(async (dataToSave) => {
    setIsSaving(true)
    setError(null)
    
    try {
      await saveFunction(dataToSave)
      setLastSaved(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }, delay)
  
  useEffect(() => {
    if (data) {
      debouncedSave(data)
    }
  }, [data, debouncedSave])
  
  return {
    isSaving,
    lastSaved,
    error
  }
}
