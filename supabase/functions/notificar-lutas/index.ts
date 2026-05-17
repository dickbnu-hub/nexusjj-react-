import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_PUBLIC_KEY = "BD-Puc3bZ-hT4DnW05bdcmh5Y4mTK43_PqurndWnLP8DoNnsv6Tbhz0ZjX_hpCtw8Ey9rwRB5KXUJyW_VCNRQpg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function enviarNotificacao(sub: any, titulo: string, corpo: string) {
  try {
    const payload = JSON.stringify({ title: titulo, body: corpo, icon: "/icon-192.png" });
    // Usa a Web Push API via fetch direto para o endpoint
    const response = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "TTL": "60",
      },
      body: payload,
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function notificarLutas(lutaId?: string) {
  const agora = new Date();
  const em10min = new Date(agora.getTime() + 10 * 60 * 1000);
  const em11min = new Date(agora.getTime() + 11 * 60 * 1000);

  let query = supabase
    .from("lutas")
    .select("id, atleta1_id, atleta2_id, numero, fase, horario_previsto")
    .eq("notificacao_enviada", false)
    .not("horario_previsto", "is", null);

  if (lutaId) {
    query = query.eq("id", lutaId);
  } else {
    query = query
      .gte("horario_previsto", agora.toISOString())
      .lte("horario_previsto", em11min.toISOString());
  }

  const { data: lutas, error } = await query;
  if (error || !lutas?.length) return { notificadas: 0 };

  let notificadas = 0;

  for (const luta of lutas) {
    const atletaIds = [luta.atleta1_id, luta.atleta2_id].filter(Boolean);

    for (const atletaId of atletaIds) {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("atleta_id", atletaId);

      if (!subs?.length) continue;

      const titulo = "🥋 Sua luta está chegando!";
      const corpo = `Luta ${luta.numero} — ${luta.fase} começa em breve. Prepare-se!`;

      for (const sub of subs) {
        await enviarNotificacao(sub, titulo, corpo);
      }
    }

    await supabase
      .from("lutas")
      .update({ notificacao_enviada: true })
      .eq("id", luta.id);

    notificadas++;
  }

  return { notificadas };
}

serve(async (req) => {
  const headers = { "Content-Type": "application/json" };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { ...headers, "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" } });
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const result = await notificarLutas(body.luta_id);
    return new Response(JSON.stringify({ ok: true, ...result }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers });
  }
});
