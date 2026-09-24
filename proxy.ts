import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) =>
              request.cookies.set(name, value)
          )

          response = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              )
            }
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const caminho = request.nextUrl.pathname

  const paginasProtegidas = [
    '/dashboard',
    '/vendas',
    '/estoque',
  ]

  const precisaEstarLogado =
    paginasProtegidas.some((pagina) =>
      caminho.startsWith(pagina)
    )

  if (precisaEstarLogado && !user) {
    const url = request.nextUrl.clone()

    url.pathname = '/login'

    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/vendas/:path*',
    '/estoque/:path*',
  ],
}