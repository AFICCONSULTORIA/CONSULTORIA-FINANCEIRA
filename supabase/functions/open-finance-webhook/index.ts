// Supabase Edge Function: open-finance-webhook
// Processa eventos em tempo real do agregador de Open Finance (ex: Pluggy, Belvo)
// e sincroniza lançamentos bancários diretamente na tabela transactions do Supabase.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-pluggy-signature",
};

interface WebhookPayload {
  event: "item/created" | "item/updated" | "transactions/created" | "transactions/deleted" | "item/error";
  itemId: string;
  data?: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: WebhookPayload = await req.json();
    console.log(`[Open Finance Webhook] Evento recebido: ${body.event} para o item: ${body.itemId}`);

    // 1. Busca qual usuário é dono deste item de conexão
    const { data: connection, error: connError } = await supabase
      .from("bank_connections")
      .select("id, user_id, institution_name")
      .eq("item_id", body.itemId)
      .single();

    if (connError || !connection) {
      console.warn(`[Open Finance Webhook] Conexão não encontrada para item: ${body.itemId}`);
      return new Response(JSON.stringify({ message: "Conexão não encontrada" }), {
        status: 200, // Retorna 200 para evitar retentativas desnecessárias do webhook
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Trata atualização de status ou novos lançamentos
    if (body.event === "item/updated") {
      await supabase
        .from("bank_connections")
        .update({
          status: "UPDATED",
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", connection.id);
    }

    if (body.event === "transactions/created" && Array.isArray(body.data?.transactions)) {
      const txs = body.data.transactions;
      const recordsToInsert = txs.map((t: any) => {
        const isIncome = t.amount > 0;
        return {
          user_id: connection.user_id,
          connection_id: connection.id,
          external_id: t.id,
          type: isIncome ? "income" : "expense",
          description: t.description || "Lançamento Open Finance",
          amount: Math.abs(t.amount),
          category: t.category || "Outros",
          payment_method: "Extrato Bancário",
          date: t.date.split("T")[0],
          status: "completed",
          notes: `Sincronizado automaticamente via Open Finance (${connection.institution_name})`,
        };
      });

      // Upsert com deduplicação
      const { error: insertError } = await supabase
        .from("transactions")
        .upsert(recordsToInsert, { onConflict: "user_id,external_id", ignoreDuplicates: true });

      if (insertError) {
        console.error("[Open Finance Webhook] Erro ao gravar transações:", insertError);
      } else {
        console.log(`[Open Finance Webhook] ${recordsToInsert.length} transações gravadas com sucesso!`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[Open Finance Webhook Error]:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
