import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import Stripe from 'https://esm.sh/stripe@14.14.0'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

    // Cliente com permissões de Admin para atualizar banco e ignorar RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Cliente autenticado do usuário que está fazendo a requisição
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado: Token ausente' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data: { user: callerUser }, error: userError } = await supabaseUserClient.auth.getUser(token)
    if (userError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Sessão inválida ou expirada' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verificar papel do caller
    const { data: callerProfile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', callerUser.id)
      .single()

    const isCallerAdmin = callerProfile?.role === 'admin'

    // Ler corpo da requisição
    const body = await req.json().catch(() => ({}))
    const targetUserId = body.userId || callerUser.id
    const targetEmail = (body.email || '').trim().toLowerCase()
    const cancelReason = body.reason || 'Cancelamento solicitado pelo usuário/admin'

    // Segurança: Somente Administradores podem cancelar assinaturas de terceiros
    if (targetUserId !== callerUser.id && !isCallerAdmin) {
      return new Response(JSON.stringify({ error: 'Acesso negado: você só pode cancelar sua própria assinatura.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[Cancel Subscription] Iniciando cancelamento para o usuário: ${targetUserId} (${targetEmail || 'sem email direto'})`)

    // Buscar dados do usuário alvo no banco
    const { data: targetProfile } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, stripe_customer_id, stripe_subscription_id')
      .eq('id', targetUserId)
      .single()

    const effectiveEmail = targetEmail || targetProfile?.email || callerUser.email || ''
    const cancelledSubscriptions: string[] = []

    // 1. Cancelamento direto se tivermos stripe_subscription_id salvo
    if (targetProfile?.stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.cancel(targetProfile.stripe_subscription_id)
        console.log(`[Stripe] Assinatura cancelada diretamente por ID: ${sub.id}`)
        cancelledSubscriptions.push(sub.id)
      } catch (err: any) {
        console.warn(`[Stripe] Falha ao cancelar por stripe_subscription_id (${targetProfile.stripe_subscription_id}):`, err.message)
      }
    }

    // 2. Buscar no Stripe por metadata['user_id']
    if (cancelledSubscriptions.length === 0 && targetUserId) {
      try {
        const searchRes = await stripe.subscriptions.search({
          query: `metadata['user_id']:'${targetUserId}' AND status:'active'`,
        })
        for (const sub of searchRes.data) {
          const cancelled = await stripe.subscriptions.cancel(sub.id)
          console.log(`[Stripe] Assinatura cancelada via metadata user_id: ${cancelled.id}`)
          cancelledSubscriptions.push(cancelled.id)
        }
      } catch (err: any) {
        console.warn('[Stripe Search user_id err]:', err.message)
      }
    }

    // 3. Buscar no Stripe pelo e-mail do cliente (garante o cancelamento caso não haja metadata)
    if (effectiveEmail) {
      try {
        const customers = await stripe.customers.list({
          email: effectiveEmail,
          limit: 10
        })

        for (const customer of customers.data) {
          const subs = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active'
          })

          for (const sub of subs.data) {
            if (!cancelledSubscriptions.includes(sub.id)) {
              const cancelled = await stripe.subscriptions.cancel(sub.id)
              console.log(`[Stripe] Assinatura cancelada via Customer Email (${effectiveEmail}): ${cancelled.id}`)
              cancelledSubscriptions.push(cancelled.id)
            }
          }
        }
      } catch (err: any) {
        console.warn('[Stripe List by Email err]:', err.message)
      }
    }

    // 4. Se tiver stripe_customer_id salvo no perfil
    if (targetProfile?.stripe_customer_id) {
      try {
        const subs = await stripe.subscriptions.list({
          customer: targetProfile.stripe_customer_id,
          status: 'active'
        })
        for (const sub of subs.data) {
          if (!cancelledSubscriptions.includes(sub.id)) {
            const cancelled = await stripe.subscriptions.cancel(sub.id)
            console.log(`[Stripe] Assinatura cancelada via stripe_customer_id: ${cancelled.id}`)
            cancelledSubscriptions.push(cancelled.id)
          }
        }
      } catch (err: any) {
        console.warn('[Stripe List by stripe_customer_id err]:', err.message)
      }
    }

    // 5. Atualizar o perfil no Supabase public.users
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({
        has_portfolio_access: false,
        subscription_status: 'cancelled',
        subscription_canceled_at: new Date().toISOString(),
        subscription_cancel_reason: cancelReason
      })
      .eq('id', targetUserId)

    if (dbError) {
      console.error('[Supabase DB Error ao cancelar]:', dbError)
      // Fallback básico
      await supabaseAdmin
        .from('users')
        .update({ has_portfolio_access: false })
        .eq('id', targetUserId)
    }

    return new Response(JSON.stringify({
      success: true,
      message: cancelledSubscriptions.length > 0 
        ? `Assinatura cancelada no Stripe (${cancelledSubscriptions.join(', ')}) e cobranças futuras suspensas.`
        : 'Assinatura cancelada no sistema e acesso suspenso. (Nenhuma assinatura ativa pendente encontrada no Stripe)',
      cancelled_subscriptions: cancelledSubscriptions,
      stripe_cancelled: cancelledSubscriptions.length > 0
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('[Geral Error cancel-stripe-subscription]:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
