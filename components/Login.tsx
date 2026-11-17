'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { error } = await getSupabase().auth.signInWithPassword({ email, password: senha })
    setCarregando(false)
    if (error) setErro('E-mail ou senha incorretos. Confira e tente de novo.')
  }

  return (
    <main className="mx-auto max-w-md p-5">
      <h1 className="mb-1 text-2xl font-bold">🛒 Mercearia</h1>
      <p className="mb-4 text-gray-700">Entre para ver o estoque.</p>
      <form onSubmit={entrar} className="card">
        <label className="rotulo" htmlFor="email">E-mail</label>
        <input id="email" type="email" className="campo" value={email}
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <label className="rotulo" htmlFor="senha">Senha</label>
        <input id="senha" type="password" className="campo" value={senha}
          onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
        {erro && <div className="erro">{erro}</div>}
        <button className="btn mt-4 w-full" disabled={carregando}>
          {carregando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
