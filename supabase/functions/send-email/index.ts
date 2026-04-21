import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM_EMAIL = 'Donatocup <turnier@DEINE-DOMAIN.de>'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  try {
    const { tournament_id, subject, body } = await req.json()
    if (!tournament_id || !subject || !body) {
      return new Response(JSON.stringify({ error: 'tournament_id, subject and body required' }), { status: 400 })
    }

    // Service-role client to read participant emails
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: participants, error } = await sb
      .from('tournament_participants')
      .select('profiles(email, display_name)')
      .eq('tournament_id', tournament_id)

    if (error) throw error

    const emails = (participants ?? [])
      .map((p: any) => p.profiles)
      .filter(Boolean)

    if (!emails.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: 'Keine Teilnehmer gefunden' }))
    }

    // Send via Resend (batch — one per recipient for personalization)
    const results = await Promise.allSettled(
      emails.map((p: { email: string; display_name?: string }) =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [p.email],
            subject,
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#115217;color:#fff;border-radius:12px;overflow:hidden;">
                <div style="background:#0a1f0b;padding:24px 28px;border-bottom:1px solid rgba(255,255,255,.1);">
                  <span style="font-size:24px;">🎾</span>
                  <span style="font-size:20px;font-weight:900;font-style:italic;margin-left:10px;color:#fff;">Donatocup</span>
                </div>
                <div style="padding:28px;">
                  <p style="margin:0 0 8px;color:rgba(255,255,255,.5);font-size:13px;">Hallo ${p.display_name || ''}!</p>
                  <div style="font-size:15px;line-height:1.6;white-space:pre-wrap;">${body.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
                </div>
                <div style="padding:16px 28px;background:rgba(0,0,0,.2);font-size:12px;color:rgba(255,255,255,.3);">
                  Du erhältst diese Mail, weil du für ein Donatocup-Turnier angemeldet bist.
                </div>
              </div>`,
          }),
        })
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.length - sent

    return new Response(
      JSON.stringify({ ok: true, sent, failed }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
