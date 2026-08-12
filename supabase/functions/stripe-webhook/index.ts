import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import Stripe from 'https://esm.sh/stripe@14.14.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createCryptoProvider()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') as string

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      )
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Pagamento Confirmado
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id

      if (userId) {
        console.log(`[Stripe Webhook] Liberando acesso para o usuário: ${userId}`)
        
        // Se houver uma assinatura, atualizamos os metadados dela no Stripe com o userId
        // para facilitar cancelamentos futuros
        if (session.subscription) {
          await stripe.subscriptions.update(session.subscription as string, {
            metadata: { user_id: userId }
          });
        }

        const { error } = await supabase
          .from('users')
          .update({ has_portfolio_access: true })
          .eq('id', userId)
          
        if (error) {
          console.error('[Supabase Error]', error)
          throw error
        }
      } else {
        console.warn('[Stripe Webhook] Checkout concluído, mas SEM client_reference_id. Usuário não identificado.')
      }
    } 
    
    // Assinatura Cancelada / Deletada
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      
      // Resgatamos o userId que salvamos nos metadados durante a criação
      const userId = subscription.metadata?.user_id

      if (userId) {
        console.log(`[Stripe Webhook] Assinatura cancelada. Bloqueando acesso para o usuário: ${userId}`)
        const { error } = await supabase
          .from('users')
          .update({ has_portfolio_access: false })
          .eq('id', userId)

        if (error) {
          console.error('[Supabase Error]', error)
          throw error
        }
      } else {
        console.warn('[Stripe Webhook] Assinatura deletada, mas não encontramos o user_id nos metadados.')
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: any) {
    console.error('[Geral Error]', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
