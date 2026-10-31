import { useState, useEffect, useCallback } from 'react'
import gunService from '../services/gunService'

// 3. Objek Cache Global untuk Query Caching
const gunCache = {}

export function useGuns(params = {}) {
  const [guns, setGuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)
  
  const paramKey = JSON.stringify(params)

  const fetchGuns = useCallback(async () => {
    // Kembalikan dari cache jika ada
    if (gunCache[paramKey]) {
      setGuns(gunCache[paramKey].data)
      setPagination(gunCache[paramKey].pagination)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await gunService.getGuns(params)
      if (response.success) {
        // 6. Filter data soft delete
        const archives = JSON.parse(localStorage.getItem('archived_guns') || '[]')
        const filteredData = (response.data || []).filter(g => !archives.includes(g.id))
        
        // Simpan ke memory cache
        gunCache[paramKey] = { data: filteredData, pagination: response.pagination || null }
        
        setGuns(filteredData)
        setPagination(response.pagination || null)
      } else {
        setError(response.message || 'Failed to fetch products.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching products.')
      setGuns([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey])

  useEffect(() => {
    fetchGuns()
  }, [fetchGuns])

  return { guns, loading, error, pagination, refetch: fetchGuns }
}

export function useGunById(id) {
  const [gun, setGun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGun = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      
      // Filter soft delete
      const archives = JSON.parse(localStorage.getItem('archived_guns') || '[]')
      if (archives.includes(id)) {
         setError('Product has been archived or deleted.')
         setGun(null)
         setLoading(false)
         return
      }

      const response = await gunService.getGunById(id)
      if (response.success) {
        setGun(response.data)
      } else {
        setError(response.message || 'Product not found.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load product details.')
      setGun(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchGun()
  }, [fetchGun])

  return { gun, loading, error, refetch: fetchGun }
}