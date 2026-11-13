/** Заявка с сайта: форматирование телефона и проверка полей. Без React — легко тестировать. */

export interface Lead {
  name: string;
  phone: string;
  service: string;
  date: string; // YYYY-MM-DD
  consent: boolean;
}

export type LeadErrors = Partial<Record<keyof Lead, string>>;

/** Цифры номера в формате 7XXXXXXXXXX. */
export const phoneDigits = (value: string): string => {
  let d = value.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('8')) d = '7' + d.slice(1);
  return d;
};

/** Маска +7 (XXX) XXX-XX-XX. Принимает ввод с «+7», «8» или просто 10 цифр. */
export function formatPhone(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (raw.trim().startsWith('+7')) d = d.slice(1);
  else if (d.length === 11 && /^[78]/.test(d)) d = d.slice(1);
  d = d.slice(0, 10);
  if (!d.length) return raw.trim().startsWith('+7') ? '+7 ' : '';
  let out = '+7 (' + d.slice(0, 3);
  if (d.length >= 3) out += ')';
  if (d.length > 3) out += ' ' + d.slice(3, 6);
  if (d.length > 6) out += '-' + d.slice(6, 8);
  if (d.length > 8) out += '-' + d.slice(8, 10);
  return out;
}

export function validateLead(l: Lead, todayISO: string): LeadErrors {
  const e: LeadErrors = {};
  if (!/^[A-Za-zА-Яа-яЁё\-\s]{2,}$/.test(l.name.trim())) e.name = 'Введите имя — минимум 2 буквы';
  if (phoneDigits(l.phone).length !== 11) e.phone = 'Введите номер полностью';
  if (!l.service) e.service = 'Выберите услугу';
  if (!l.date || l.date < todayISO) e.date = 'Выберите дату не раньше сегодняшней';
  if (!l.consent) e.consent = 'Нужно согласие';
  return e;
}
