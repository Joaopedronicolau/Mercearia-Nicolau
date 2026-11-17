'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'
import Login from '@/components/Login'
import Painel from '@/components/Painel'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    const sb = getSupabase()
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setPronto(true)
    })
    const { data: sub } = sb.auth.onAuthStateChange((_evento, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!pronto) return <p className="p-6 text-xl">Carregando…</p>
  return session ? <Painel /> : <Login />
}
