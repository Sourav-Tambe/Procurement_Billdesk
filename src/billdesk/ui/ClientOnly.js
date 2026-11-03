// Renders children only after the page has mounted in the browser. The app's theme sets the page background in an effect
// (UserThemeOptions), so the first server render has an empty colour; signed-in pages hide that behind the auth spinner.
// Procure V3 pages open without signing in, so they wait one tick instead.
import { useEffect, useState } from 'react'
import FallbackSpinner from 'src/@core/components/spinner'

const ClientOnly = ({ children }) => {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  return ready ? children : <FallbackSpinner />
}

export default ClientOnly
