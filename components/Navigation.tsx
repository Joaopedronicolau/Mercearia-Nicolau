'use client'

import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function ativo(caminho: string) {
    return pathname === caminho
  }

  return (
    <>
      {/* MENU DESKTOP */}
      <header className="desktop-navigation">
        <div className="navigation-container">

          <a
            href="/dashboard"
            className="navigation-logo"
          >
            <div className="navigation-logo-icon">
              🍫
            </div>

            <div>
              <strong>MK Doces</strong>
              <span>Gestão de vendas</span>
            </div>
          </a>

          <nav className="navigation-links">

            <a
              href="/dashboard"
              className={
                ativo('/dashboard')
                  ? 'navigation-link active'
                  : 'navigation-link'
              }
            >
              🏠 Início
            </a>

            <a
              href="/vendas"
              className={
                pathname.startsWith('/vendas')
                  ? 'navigation-link active'
                  : 'navigation-link'
              }
            >
              🛒 Vendas
            </a>

            <a
              href="/produtos"
              className={
                pathname.startsWith('/produtos')
                  ? 'navigation-link active'
                  : 'navigation-link'
              }
            >
              🍫 Produtos
            </a>

            <a
              href="/estoque"
              className={
                pathname.startsWith('/estoque')
                  ? 'navigation-link active'
                  : 'navigation-link'
              }
            >
              📦 Estoque
            </a>

            <button
              onClick={sair}
              className="navigation-logout"
            >
              Sair
            </button>

          </nav>
        </div>
      </header>

      

      {/* MENU INFERIOR MOBILE */}
      <nav className="mobile-bottom-navigation">

        <a
          href="/dashboard"
          className={
            ativo('/dashboard')
              ? 'mobile-nav-link active'
              : 'mobile-nav-link'
          }
        >
          <span>🏠</span>
          <small>Início</small>
        </a>

        <a
          href="/vendas"
          className={
            pathname.startsWith('/vendas')
              ? 'mobile-nav-link active'
              : 'mobile-nav-link'
          }
        >
          <span>🛒</span>
          <small>Vendas</small>
        </a>

        <a
          href="/produtos"
          className={
            pathname.startsWith('/produtos')
              ? 'mobile-nav-link active'
              : 'mobile-nav-link'
          }
        >
          <span>🍫</span>
          <small>Produtos</small>
        </a>

        <a
          href="/estoque"
          className={
            pathname.startsWith('/estoque')
              ? 'mobile-nav-link active'
              : 'mobile-nav-link'
          }
        >
          <span>📦</span>
          <small>Estoque</small>
        </a>

        <button
          onClick={sair}
          className="mobile-nav-link"
        >
          <span>🚪</span>
          <small>Sair</small>
        </button>

      </nav>
    </>
  )
}