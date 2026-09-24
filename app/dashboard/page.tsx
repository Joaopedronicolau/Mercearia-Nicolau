'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

export default function DashboardPage() {
  const [vendasHoje, setVendasHoje] = useState(0)
  const [faturamentoHoje, setFaturamentoHoje] = useState(0)
  const [perdasHoje, setPerdasHoje] = useState(0)
  const [produtos, setProdutos] = useState(0)
  const [carregando, setCarregando] = useState(true)

  async function carregarDashboard() {
    const agora = new Date()

    const inicioHoje = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate()
    )

    const inicioAmanha = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate() + 1
    )

    const { data: vendas, error: erroVendas } =
      await supabase
        .from('vendas')
        .select('total, criado_em')
        .gte('criado_em', inicioHoje.toISOString())
        .lt('criado_em', inicioAmanha.toISOString())

    if (erroVendas) {
      console.error(erroVendas)
    }

    const faturamento =
      vendas?.reduce(
        (total, venda) =>
          total + Number(venda.total),
        0
      ) || 0

    setVendasHoje(vendas?.length || 0)
    setFaturamentoHoje(faturamento)

    const { data: perdas, error: erroPerdas } =
      await supabase
        .from('movimentacoes_estoque')
        .select('quantidade, criado_em')
        .eq('tipo', 'perda')
        .gte('criado_em', inicioHoje.toISOString())
        .lt('criado_em', inicioAmanha.toISOString())

    if (erroPerdas) {
      console.error(erroPerdas)
    }

    const quantidadePerdida =
      perdas?.reduce(
        (total, perda) =>
          total + Math.abs(Number(perda.quantidade)),
        0
      ) || 0

    setPerdasHoje(quantidadePerdida)

    const { count, error: erroProdutos } =
      await supabase
        .from('produtos')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('ativo', true)

    if (erroProdutos) {
      console.error(erroProdutos)
    }

    setProdutos(count || 0)

    setCarregando(false)
  }

  useEffect(() => {
    carregarDashboard()
  }, [])

  if (carregando) {
    return (
      <main>
        <Navigation />

        <div className="page-container">
          <p>Carregando painel...</p>
        </div>
      </main>
    )
  }

  return (
    <main>
      <Navigation />

      <div className="page-container">
        <section>
          <p
            style={{
              margin: 0,
              color: 'var(--roxo)',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            ✨ Painel da loja
          </p>

          <h1 className="page-title">
            Olá! 💜
          </h1>

          <p className="page-subtitle">
            Aqui está o resumo das vendas de hoje.
          </p>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🛒</div>

            <p className="stat-label">
              Vendas hoje
            </p>

            <strong className="stat-value">
              {vendasHoje}
            </strong>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>

            <p className="stat-label">
              Faturamento
            </p>

            <strong className="stat-value">
              R$ {faturamentoHoje
                .toFixed(2)
                .replace('.', ',')}
            </strong>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🍫</div>

            <p className="stat-label">
              Produtos
            </p>

            <strong className="stat-value">
              {produtos}
            </strong>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚠️</div>

            <p className="stat-label">
              Perdas hoje
            </p>

            <strong className="stat-value">
              {perdasHoje}
            </strong>
          </div>
        </section>

        <section style={{ marginTop: 38 }}>
          <h2 className="section-title">
            Ações rápidas ✨
          </h2>

          <div className="quick-actions">
            <a
              href="/vendas"
              className="quick-action primary"
            >
              <span className="quick-action-icon">
                🛒
              </span>

              <span className="quick-action-title">
                Nova venda
              </span>

              <span className="quick-action-description">
                Registrar uma nova venda
              </span>
            </a>

            <a
              href="/estoque"
              className="quick-action"
            >
              <span className="quick-action-icon">
                📦
              </span>

              <span className="quick-action-title">
                Ver estoque
              </span>

              <span className="quick-action-description">
                Conferir produtos e movimentações
              </span>
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}