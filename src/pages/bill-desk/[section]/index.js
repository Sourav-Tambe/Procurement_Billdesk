// /bill-desk/challans and /bill-desk/invoices open the role's first tab of that page (ia.js firstTab)
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { getRole } from 'src/billdesk/roles'
import { IA, firstTab } from 'src/billdesk/ia'

const SectionHome = () => {
  const router = useRouter()
  useEffect(() => {
    const section = window.location.pathname.split('/')[2]
    router.replace(IA.some(x => x.slug === section) ? `/bill-desk/${section}/${firstTab(section, getRole())}` : '/bill-desk')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default SectionHome
