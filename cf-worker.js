// =============================================================
//  Cloudflare Worker — прокси для отправки заявок в Telegram
//  Деплой: https://workers.cloudflare.com (бесплатный план)
//
//  Инструкция:
//  1. Зайди на dash.cloudflare.com → Workers & Pages → Create
//  2. Вставь весь этот код в редактор
//  3. Замени BOT_TOKEN и CHAT_ID на реальные значения
//  4. Нажми Deploy
//  5. Скопируй URL воркера (вида xxxx.workers.dev)
//  6. В script.js замени WORKER_URL на этот URL
// =============================================================

const BOT_TOKEN = '8746557189:AAGmEHb7kEvdcQ63e1NWBdpnoVECY7I13L0';
const CHAT_ID   = '8715001372';

const ALLOWED_ORIGINS = [
  'https://tk-webb.ru',
  'https://www.tk-webb.ru',
];

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '';

    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, contact, message, service } = body;

    if (!name || !contact) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serviceLabel = service ? `\n🎯 Интерес: ${service}` : '';
    const text =
      `📬 Новая заявка с сайта TK Web\n\n` +
      `👤 Имя: ${name}\n` +
      `📞 Контакт: ${contact}` +
      serviceLabel +
      (message ? `\n💬 Сообщение: ${message}` : '');

    const tgRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
      }
    );

    const tgData = await tgRes.json();

    return new Response(JSON.stringify({ ok: tgData.ok }), {
      status: tgData.ok ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
