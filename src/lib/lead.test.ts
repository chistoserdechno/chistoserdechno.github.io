import { describe, expect, it } from 'vitest';
import { formatPhone, phoneDigits, validateLead } from './lead';

describe('formatPhone', () => {
  it('набор с префиксом +7', () => {
    let v = '+7 ';
    for (const ch of '9811472010') v = formatPhone(v + ch);
    expect(v).toBe('+7 (981) 147-20-10');
  });
  it('вставка номера с восьмёркой', () => expect(formatPhone('89811472010')).toBe('+7 (981) 147-20-10'));
  it('лишние цифры обрезаются', () => expect(formatPhone('+7 (981) 147-20-109')).toBe('+7 (981) 147-20-10'));
});

describe('validateLead', () => {
  const ok = { name: 'Анна', phone: '+7 (981) 147-20-10', service: 'Генеральная уборка', date: '2030-01-01', consent: true };
  it('корректная заявка без ошибок', () => expect(validateLead(ok, '2026-11-13')).toEqual({}));
  it('прошедшая дата — ошибка', () => expect(validateLead({ ...ok, date: '2020-01-01' }, '2026-11-13').date).toBeTruthy());
  it('короткий номер — ошибка', () => expect(validateLead({ ...ok, phone: '+7 (981)' }, '2026-11-13').phone).toBeTruthy());
  it('phoneDigits приводит 8 к 7', () => expect(phoneDigits('8 981 147 20 10')).toBe('79811472010'));
});
