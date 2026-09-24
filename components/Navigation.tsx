'use client'

import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()

  function ativo(path: string) {
    return pathname === path
  }

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* NAVEGAÇÃO DESKTOP */}
      <header className="navigation-desktop">

        <div className="navigation-container">

          {/* LOGO */}
          <button
            type="button"
            className="navigation-brand"
            onClick={() =>
              router.push('/dashboard')
            }
          >
            <div className="navigation-logo">
              🏪
            </div>

            <div>
              <strong>
                Mercearia Nicolau
              </strong>

              <span>
                Gestão de vendas
              </span>
            </div>
          </button>

          {/* LINKS */}
          <nav className="navigation-links">

            <button
              type="button"
              className={
                ativo('/dashboard')
                  ? 'navigation-link active'
                  : 'navigation-link'
              }
              onClick={() =>
                router.push('/dashboard')
              }
            >
              <span>🏠</span>
              Início
            </button>

            <button
              type="button"
              className={
                ativo('/vendas')
                  ? 'navigation-link active'
                  : 'navigation-link'
              }
              onClick={() =>
                router.push('/vendas')
              }
            >
              <span>🛒</span>
              Vendas
            </button>

            <button
              type="button"
              className={
                ativo('/produtos')
                  ? 'navigation-link active'
                  : 'navigation-link'
              }
              onClick={() =>
                router.push('/produtos')
              }
            >
              <span>📦</span>
              Produtos
            </button>

            <button
              type="button"
              className={
                ativo('/estoque')
                  ? 'navigation-link active'
                  : 'navigation-link'
              }
              onClick={() =>
                router.push('/estoque')
              }
            >
              <span>📊</span>
              Estoque
            </button>

          </nav>

          {/* SAIR */}
          <button
            type="button"
            className="navigation-logout"
            onClick={sair}
          >
            <span>↪</span>
            Sair
          </button>

        </div>

      </header>

      {/* NAVEGAÇÃO MOBILE */}
      <nav className="navigation-mobile">

        <button
          type="button"
          className={
            ativo('/dashboard')
              ? 'mobile-navigation-link active'
              : 'mobile-navigation-link'
          }
          onClick={() =>
            router.push('/dashboard')
          }
        >
          <span>🏠</span>
          <small>Início</small>
        </button>

        <button
          type="button"
          className={
            ativo('/vendas')
              ? 'mobile-navigation-link active'
              : 'mobile-navigation-link'
          }
          onClick={() =>
            router.push('/vendas')
          }
        >
          <span>🛒</span>
          <small>Vendas</small>
        </button>

        <button
          type="button"
          className={
            ativo('/produtos')
              ? 'mobile-navigation-link active'
              : 'mobile-navigation-link'
          }
          onClick={() =>
            router.push('/produtos')
          }
        >
          <span>📦</span>
          <small>Produtos</small>
        </button>

        <button
          type="button"
          className={
            ativo('/estoque')
              ? 'mobile-navigation-link active'
              : 'mobile-navigation-link'
          }
          onClick={() =>
            router.push('/estoque')
          }
        >
          <span>📊</span>
          <small>Estoque</small>
        </button>

        <button
          type="button"
          className="mobile-navigation-link"
          onClick={sair}
        >
          <span>↪</span>
          <small>Sair</small>
        </button>

      </nav>
    </>
  )
}