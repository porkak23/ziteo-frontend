import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { getProductImageUrl } from '../../features/tienda/utils/productImages'

interface SearchProject { id: string; title: string; status: string; photo_url: string | null }
interface SearchProfile { user_id: string; name: string; active_role: string; avatar_url: string | null }
interface SearchProduct { id: string; name: string; price_unit: number; image_url: string | null }

export function useGlobalSearch(query: string) {
  const [projects, setProjects] = useState<SearchProject[]>([])
  const [profiles, setProfiles] = useState<SearchProfile[]>([])
  const [products, setProducts] = useState<SearchProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (query.trim().length < 2) {
      setProjects([])
      setProfiles([])
      setProducts([])
      return
    }

    let isMounted = true

    const fetchSearch = async () => {
      setIsLoading(true)
      try {
        const [projReq, profReq, prodReq] = await Promise.all([
          supabase.from('projects').select('id,title,status,photo_url').ilike('title', `%${query}%`).limit(5),
          supabase.from('profiles').select('user_id,name,active_role,avatar_url').ilike('name', `%${query}%`).limit(5),
          supabase.from('products').select('id,name,price_unit,image_url').ilike('name', `%${query}%`).limit(5)
        ])

        if (isMounted) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setProjects(projReq.error ? [] : ((projReq.data || []) as any))
          setProfiles(profReq.error ? [] : (profReq.data || []))
          setProducts(
            prodReq.error
              ? []
              : (prodReq.data || []).map((p: any) => ({
                  ...p,
                  image_url: getProductImageUrl(p.name, p.image_url),
                }))
          )
        }
      } catch (error) {
        console.error('Global search error:', error)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchSearch()

    return () => {
      isMounted = false
    }
  }, [query])

  const isEmpty = query.trim().length >= 2 && !isLoading && projects.length === 0 && profiles.length === 0 && products.length === 0

  return { projects, profiles, products, isLoading, isEmpty }
}
