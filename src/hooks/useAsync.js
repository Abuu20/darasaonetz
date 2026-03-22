import { useState, useCallback } from 'react'

export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState('idle')
  const [value, setValue] = useState(null)
  const [error, setError] = useState(null)

  const execute = useCallback((...args) => {
    setStatus('pending')
    setValue(null)
    setError(null)

    return asyncFunction(...args)
      .then(response => {
        setValue(response)
        setStatus('success')
        return response
      })
      .catch(error => {
        setError(error)
        setStatus('error')
        return error
      })
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return { execute, status, value, error }
}

// Hook for API calls with loading/error states
export const useApi = (apiFunction) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const call = async (...args) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await apiFunction(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    call,
    loading,
    error,
    data
  }
}

// Hook for mutations (POST, PUT, DELETE)
export const useMutation = (mutationFunction) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const mutate = async (variables) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await mutationFunction(variables)
      setData(result)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    mutate,
    loading,
    error,
    data
  }
}
