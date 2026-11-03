// procure-web-lite stand-in: the Pharmacy module isn't here
import { createContext, useContext } from 'react'
const PharmacyContext = createContext({ selectedPharmacy: null, setSelectedPharmacy: () => {} })
export const PharmacyProvider = ({ children }) => children
export const usePharmacyContext = () => useContext(PharmacyContext)
export default PharmacyContext
