// procure-web-lite stand-in: no sign-in
import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
export const useAuth = () => useContext(AuthContext)
