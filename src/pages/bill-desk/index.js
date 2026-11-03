// /bill-desk/ → the home of the role Bill Desk is viewed as
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { me } from 'src/billdesk/roles'

const BillDeskHome = () => {
  const router = useRouter()
  useEffect(() => { router.replace(me().home) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default BillDeskHome
