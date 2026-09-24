'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function fazerLogin(event: FormEvent) {
    event.preventDefault()

    setErro('')
    setCarregando(true)

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })

    if (error) {
      console.error(error)
      setErro('E-mail ou senha incorretos.')
      setCarregando(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-logo">
          🍫
        </div>

        <h1 className="login-title">
          MK Doces
        </h1>

        <p className="login-subtitle">
          Entre para acessar a loja 💜
        </p>

        <form onSubmit={fazerLogin}>
          <div className="input-group">
            <label className="input-label">
              E-mail
            </label>

            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              Senha
            </label>

            <input
              className="input"
              type="password"
              value={senha}
              onChange={(event) =>
                setSenha(event.target.value)
              }
              placeholder="Digite sua senha"
              required
            />
          </div>

          {erro && (
            <div className="message">
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="button button-primary"
            disabled={carregando}
            style={{
              width: '100%',
              marginTop: 8,
            }}
          >
            {carregando
              ? 'Entrando...'
              : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}