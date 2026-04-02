import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.getMe()
      if (res.ok) setUser(res.data)
    } catch (e) {
      // silently fail
    } finally {
      setLoadingUser(false)
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('jira_auth')
    if (stored) {
      fetchUser()
    } else {
      setLoadingUser(false)
    }
  }, [fetchUser])

  const updateUser = useCallback((updatedFields) => {
    if (updatedFields === null) {
      setUser(null);
      return;
    }
    setUser(prev => prev ? { ...prev, ...updatedFields } : updatedFields)
  }, [])

  const refreshUser = useCallback(() => {
    return fetchUser()
  }, [fetchUser])

  return (
    <UserContext.Provider value={{ user, loadingUser, updateUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
