import { useMemo, useCallback } from 'react'

/**
 * Safe router hook that works in both Page Router and App Router contexts.
 * Falls back to window.location for redirects if router is not available.
 */
export const useSafeRouter = () => {
  // Try to use Page Router
  let pageRouterInstance = null
  let isPageRouter = false

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useRouter } = require('next/router')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    pageRouterInstance = useRouter()

    // Check if we're actually in Page Router context
    // In App Router pages, useRouter() from next/router may return an object
    // but with empty query and events undefined — detect this to avoid false positives
    if (
      pageRouterInstance &&
      pageRouterInstance.pathname !== undefined &&
      pageRouterInstance.events !== undefined
    ) {
      isPageRouter = true
    }
  } catch (e) {
    // Not in Page Router context or router not mounted
    isPageRouter = false
  }

  // Try to use App Router
  let appRouterInstance = null
  let appPathname = null
  let appSearchParams = null
  let appParams = null
  let isAppRouter = false

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useRouter, usePathname, useSearchParams, useParams } = require('next/navigation')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    appRouterInstance = useRouter()
    // eslint-disable-next-line react-hooks/rules-of-hooks
    appPathname = usePathname()
    // eslint-disable-next-line react-hooks/rules-of-hooks
    appParams = useParams()

    // useSearchParams may throw without a Suspense boundary — isolate it
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      appSearchParams = useSearchParams()
    } catch (_) {
      appSearchParams = null
    }

    if (appRouterInstance && appPathname !== null) {
      isAppRouter = true
    }
  } catch (e) {
    // Not in App Router context
    isAppRouter = false
  }

  // Convert Page Router style URL objects to strings for App Router compatibility
  const toUrlString = url => {
    if (typeof url === 'string') return url
    if (typeof url === 'object' && url !== null) {
      let path = url.pathname || ''
      const query = url.query
      if (query) {
        const qs = typeof query === 'string'
          ? query
          : Object.entries(query)
              .filter(([, v]) => v !== undefined && v !== null && v !== '')
              .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
              .join('&')
        if (qs) path += `?${qs}`
      }
      return path
    }
    return String(url)
  }

  const push = useCallback(
    (url, as, options) => {
      if (isPageRouter && pageRouterInstance) {
        pageRouterInstance.push(url, as, options)
      } else if (isAppRouter && appRouterInstance) {
        appRouterInstance.push(toUrlString(url))
      } else {
        // Fallback to window.location
        if (typeof window !== 'undefined') {
          window.location.href = toUrlString(url)
        }
      }
    },
    [isPageRouter, pageRouterInstance, isAppRouter, appRouterInstance]
  )

  const replace = useCallback(
    (url, as, options) => {
      if (isPageRouter && pageRouterInstance) {
        pageRouterInstance.replace(url, as, options)
      } else if (isAppRouter && appRouterInstance) {
        appRouterInstance.replace(toUrlString(url))
      } else {
        // Fallback to window.location
        if (typeof window !== 'undefined') {
          window.location.replace(toUrlString(url))
        }
      }
    },
    [isPageRouter, pageRouterInstance, isAppRouter, appRouterInstance]
  )

  const back = useCallback(() => {
    if (isPageRouter && pageRouterInstance) {
      pageRouterInstance.back()
    } else if (isAppRouter && appRouterInstance) {
      appRouterInstance.back()
    } else {
      if (typeof window !== 'undefined') {
        window.history.back()
      }
    }
  }, [isPageRouter, pageRouterInstance, isAppRouter, appRouterInstance])

  // Build query object
  const query = useMemo(() => {
    if (isPageRouter && pageRouterInstance) {
      return pageRouterInstance.query || {}
    }
    if (isAppRouter) {
      const queryObj = {}

      // Search params first
      if (appSearchParams) {
        appSearchParams.forEach((value, key) => {
          queryObj[key] = value
        })
      }

      // Path params (e.g. [id]) override search params — they define the current page
      if (appParams) {
        Object.entries(appParams).forEach(([key, value]) => {
          queryObj[key] = value
        })
      }

      return queryObj
    }

    // Fallback: parse from window.location
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const queryObj = {}
      params.forEach((value, key) => {
        queryObj[key] = value
      })

      return queryObj
    }

    return {}
  }, [isPageRouter, pageRouterInstance, isAppRouter, appSearchParams, appParams])

  // Get pathname
  const pathname = useMemo(() => {
    if (isPageRouter && pageRouterInstance) {
      return pageRouterInstance.pathname || ''
    }
    if (isAppRouter && appPathname) {
      return appPathname
    }
    if (typeof window !== 'undefined') {
      return window.location.pathname
    }

    return ''
  }, [isPageRouter, pageRouterInstance, isAppRouter, appPathname])

  // Get asPath
  const asPath = useMemo(() => {
    if (isPageRouter && pageRouterInstance) {
      return pageRouterInstance.asPath || ''
    }
    if (isAppRouter && appPathname) {
      const search = appSearchParams ? appSearchParams.toString() : ''

      return appPathname + (search ? '?' + search : '')
    }
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search
    }

    return ''
  }, [isPageRouter, pageRouterInstance, isAppRouter, appPathname, appSearchParams])

  return useMemo(
    () => ({
      push,
      replace,
      back,
      query,
      pathname,
      asPath,
      isReady: true,
      isPageRouter,
      isAppRouter
    }),
    [push, replace, back, query, pathname, asPath, isPageRouter, isAppRouter]
  )
}

export default useSafeRouter
