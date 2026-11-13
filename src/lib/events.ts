/**
 * Связь между «островами» и статическими блоками.
 * Карточка услуги, сертификат или калькулятор сообщают «выбрана услуга X»,
 * форма заявки слушает и подставляет её в поле «Услуга».
 * Острова — отдельные React-приложения, общего состояния у них нет, поэтому — событие браузера.
 *
 * Последний выбор запоминается: форма — остров с client:visible и может загрузиться
 * уже после клика, тогда она подхватит выбор при монтировании.
 */
export const SELECT_SERVICE = 'cs:select-service';

declare global {
  interface Window { __csLastService?: string }
}

export function selectService(name: string) {
  window.__csLastService = name;
  window.dispatchEvent(new CustomEvent<string>(SELECT_SERVICE, { detail: name }));
}

export function onSelectService(cb: (name: string) => void): () => void {
  if (window.__csLastService) cb(window.__csLastService);
  const handler = (e: Event) => cb((e as CustomEvent<string>).detail);
  window.addEventListener(SELECT_SERVICE, handler);
  return () => window.removeEventListener(SELECT_SERVICE, handler);
}
