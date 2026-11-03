// procure-web-lite stand-in: no sign-in. A fixed user so shared Antz widgets that read userData keep working.
import { createContext } from 'react'
const lite = { user: { id: 'lite', full_name: 'Procure lite', email: 'lite@example.com' }, userData: { user: { user_id: 'lite', user_name: 'Procure lite' }, modules: {}, roles: [] }, loading: false, setUser: () => {}, setLoading: () => {}, login: () => {}, logout: () => {} }
const AuthContext = createContext(lite)
const AuthProvider = ({ children }) => <AuthContext.Provider value={lite}>{children}</AuthContext.Provider>
export { AuthContext, AuthProvider }
