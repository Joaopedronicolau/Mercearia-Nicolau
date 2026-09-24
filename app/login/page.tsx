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

  async function entrar(event: FormEvent) {
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

      setErro(
        'E-mail ou senha incorretos.'
      )

      setCarregando(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="login-page">

      <div className="login-card">

        {/* LOGO */}
        <div className="login-logo">
          🏪
        </div>

        <h1>
          Mercearia Nicolau
        </h1>

        <p className="login-subtitle">
          Entre para acessar o sistema
        </p>

        {/* FORMULÁRIO */}
        <form onSubmit={entrar}>

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
              autoComplete="email"
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
              autoComplete="current-password"
              required
            />

          </div>

          {erro && (
            <div className="login-error">
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="button button-primary login-button"
            disabled={carregando}
          >
            {carregando
              ? 'Entrando...'
              : 'Entrar'}
          </button>

        </form>

        <p className="login-footer">
          Sistema de gestão da Mercearia Nicolau
        </p>

      </div>

    </main>
  )
}