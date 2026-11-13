/**
 * Приём заявок с сайта → сообщение в Telegram.
 * Yandex Cloud Functions, среда Node.js 22. Точка входа: index.handler
 *
 * Переменные окружения функции:
 *   BOT_TOKEN       — токен бота от @BotFather
 *   CHAT_ID         — id чата, куда слать заявки (общий чат Есении, Алины и Родиона)
 *   ALLOWED_ORIGIN  — адрес сайта, например https://chistoserdechno.ru (для CORS)
 */

const MAX_LEN = { name: 60, phone: 20, service: 60, date: 10, page: 300 };

const cors = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

const reply = (status, body, origin) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json', ...cors(origin) },
  body: JSON.stringify(body),
});

// Telegram в режиме HTML: экранируем всё, что прислал пользователь
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

function parse(event) {
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
  const data = JSON.parse(raw);
  const out = {};
  for (const [k, max] of Object.entries(MAX_LEN)) out[k] = String(data[k] ?? '').trim().slice(0, max);
  out.consent = data.consent === true;
  out.company = String(data.company ?? ''); // ловушка для ботов
  return out;
}

function validate(l) {
  if (l.company) return 'spam';
  if (l.name.length < 2) return 'name';
  if (!/^7\d{10}$/.test(l.phone)) return 'phone';
  if (!l.service) return 'service';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(l.date)) return 'date';
  if (!l.consent) return 'consent';
  return null;
}

const prettyPhone = (d) => `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
const prettyDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });

module.exports.handler = async (event) => {
  const origin = process.env.ALLOWED_ORIGIN || '*';

  if (event.httpMethod === 'OPTIONS') return reply(204, {}, origin);
  if (event.httpMethod !== 'POST') return reply(405, { ok: false, error: 'method' }, origin);

  let lead;
  try {
    lead = parse(event);
  } catch {
    return reply(400, { ok: false, error: 'json' }, origin);
  }

  const err = validate(lead);
  if (err === 'spam') return reply(200, { ok: true }, origin); // боту отвечаем «ок», но ничего не шлём
  if (err) return reply(422, { ok: false, error: err }, origin);

  const text = [
    '🧽 <b>Новая заявка с сайта</b>',
    '',
    `<b>Имя:</b> ${esc(lead.name)}`,
    `<b>Телефон:</b> ${esc(prettyPhone(lead.phone))}`,
    `<b>Услуга:</b> ${esc(lead.service)}`,
    `<b>Дата:</b> ${esc(prettyDate(lead.date))}`,
  ].join('\n');

  const res = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.CHAT_ID, text, parse_mode: 'HTML' }),
  });

  if (!res.ok) {
    console.error('Telegram error', res.status, await res.text());
    return reply(502, { ok: false, error: 'telegram' }, origin);
  }
  return reply(200, { ok: true }, origin);
};
