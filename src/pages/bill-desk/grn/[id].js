// /bill-desk/grn/<GRN no.>: GRNs › All GRNs with that GRN's sheet open over it (screens/GrnDesk, BD-72). Read after
// mount, as the challan page does. Closing the sheet returns to the list.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import GrnDesk from 'src/billdesk/screens/GrnDesk'

const GrnPage = () => {
  useRouter() // redraw on client navigation
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  if (!ready) return null
  const id = decodeURIComponent(window.location.pathname.replace(/^\/bill-desk\/grn\//, '').replace(/\/$/, ''))

  return <GrnDesk key={id} view='all' initialGrn={id} />
}

export default GrnPage
