import { useCallback, useEffect, useState } from 'react'

// Cancelling old requests prevents late responses replacing a newly selected record.
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState<{ load: typeof load; data?: T; error?: Error; loading: boolean }>({ load, loading: true })
  useEffect(() => {
    const controller = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the asynchronous resource when its request changes.
    setState({ load, loading: true })
    load(controller.signal).then(data => {
      if (!controller.signal.aborted) setState({ load, data, loading: false })
    }).catch(error => {
      if (!controller.signal.aborted) setState({ load, error: error instanceof Error ? error : new Error('Unable to load this page.'), loading: false })
    })
    return () => controller.abort()
  }, [load, revision])
  const reload = useCallback(() => setRevision(value => value + 1), [])
  return { ...(state.load === load ? state : { loading: true, data: undefined, error: undefined }), reload }
}
