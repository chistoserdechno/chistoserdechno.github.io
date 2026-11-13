import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { SERVICES } from '../../data/prices';
import { REPAIR } from '../../data/content';
import { onSelectService } from '../../lib/events';
import { formatPhone, phoneDigits, validateLead, type Lead, type LeadErrors } from '../../lib/lead';

const SERVICE_OPTIONS = [...SERVICES.map((s) => s.formName), REPAIR.formName, 'Подарочный сертификат'];

/** Адрес функции приёма заявок. Пусто — демо-режим (заявка никуда не уходит). */
const ENDPOINT = import.meta.env.PUBLIC_LEAD_ENDPOINT as string | undefined;

const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const empty: Lead = { name: '', phone: '', service: '', date: '', consent: true };

export default function BookingForm() {
  const [lead, setLead] = useState<Lead>(empty);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [submittedLead, setSubmittedLead] = useState<Lead | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const today = todayISO();

  // Услугу могут выбрать снаружи: карточка услуги, сертификат, калькулятор
  useEffect(() => onSelectService((service) => setLead((l) => ({ ...l, service }))), []);

  const set = <K extends keyof Lead>(key: K, value: Lead[K]) => {
    const next = { ...lead, [key]: value };
    setLead(next);
    // Ошибка снимается, как только поле исправлено
    if (errors[key]) setErrors(validateLead(next, today));
  };

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validateLead(lead, today);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.querySelector<HTMLElement>('.form .invalid input, .form .invalid select')?.focus();
      return;
    }
    if (honeypot.current?.value) return; // бот заполнил скрытое поле

    setStatus('sending');
    try {
      if (ENDPOINT) {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...lead, phone: phoneDigits(lead.phone), page: location.href }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        await new Promise((r) => setTimeout(r, 700)); // демо-режим
      }
      setSubmittedLead(lead);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  const reset = () => { setLead(empty); setErrors({}); setStatus('idle'); };

  const dayText = submittedLead?.date
    ? new Date(submittedLead.date + 'T00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    : '';

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="form-row">
        <div className={`field${errors.name ? ' invalid' : ''}`}>
          <label htmlFor="name">Ваше имя</label>
          <input id="name" type="text" placeholder="Анна" autoComplete="given-name"
            value={lead.name} onChange={(e) => set('name', e.target.value)} />
          <span className="error">{errors.name}</span>
        </div>
        <div className={`field${errors.phone ? ' invalid' : ''}`}>
          <label htmlFor="phone">Телефон</label>
          <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__"
            value={lead.phone}
            onFocus={() => { if (!lead.phone) set('phone', '+7 '); }}
            onBlur={() => { if (lead.phone.trim() === '+7') set('phone', ''); }}
            onChange={(e) => set('phone', formatPhone(e.target.value))} />
          <span className="error">{errors.phone}</span>
        </div>
      </div>

      <div className="form-row">
        <div className={`field${errors.service ? ' invalid' : ''}`}>
          <label htmlFor="service">Услуга</label>
          <select id="service" value={lead.service} onChange={(e) => set('service', e.target.value)}>
            <option value="">Выберите услугу</option>
            {SERVICE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <span className="error">{errors.service}</span>
        </div>
        <div className={`field${errors.date ? ' invalid' : ''}`}>
          <label htmlFor="date">Желаемая дата</label>
          <input id="date" type="date" min={today} value={lead.date} onChange={(e) => set('date', e.target.value)} />
          <span className="error">{errors.date}</span>
        </div>
      </div>

      {/* Ловушка для ботов: поле скрыто от людей */}
      <input ref={honeypot} type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} />

    <label className={`consent${errors.consent ? ' invalid' : ''}`}>
      <input type="checkbox" checked={lead.consent} onChange={(e) => set('consent', e.target.checked)} />
      <span>
        Даю <a href="/consent" target="_blank" rel="noopener" className="text-link">согласие на обработку персональных данных</a>
      </span>
    </label>

      <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Отправляем…' : <>Забронировать уборку <svg aria-hidden="true"><use href="#i-arrow" /></svg></>}
      </button>
      {status === 'error' && (
        <p className="form-error" role="alert">Не получилось отправить. Позвоните нам или напишите в мессенджер — всё решим.</p>
      )}

      <div className={`success${status === 'done' ? ' show' : ''}`} role="status" aria-live="polite">
        <div className="success-ico"><svg aria-hidden="true"><use href="#i-tick" /></svg></div>
        <h3>Заявка принята!</h3>
        <p>{submittedLead && `${submittedLead.name.trim()}, спасибо! Заявка на «${submittedLead.service}» на ${dayText} у нас. Скоро свяжемся по номеру ${submittedLead.phone}.`}</p>
        <button type="button" className="btn btn-ghost" onClick={reset}>Отправить ещё одну</button>
      </div>
    </form>
  );
}
