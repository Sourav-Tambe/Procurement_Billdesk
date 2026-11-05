// /bill-desk/dc/<DC number>: the Challans › To Group list with that challan's sheet open over it (screens/ChallanSheet).
// DC numbers carry slashes (SLA/2610/3779), so the route is a catch-all and the number is read from the address after
// mount. Closing the sheet returns to the list.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ClerkDesk from 'src/billdesk/screens/ClerkDesk'

const DcPage = () => {
  useRouter() // redraw on client navigation
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  if (!ready) return null
  const dc = decodeURIComponent(window.location.pathname.replace(/^\/bill-desk\/dc\//, '').replace(/\/$/, ''))

  return <ClerkDesk key={dc} section='challans' view='to-group' initialDc={dc} />
}

export default DcPage
