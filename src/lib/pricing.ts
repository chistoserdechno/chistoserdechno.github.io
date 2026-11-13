import { EXTRAS, DISCOUNTS, type Service } from '../data/prices';

export interface QuoteInput {
  service: Service;
  /** Индекс типа квартиры (для услуг «по комнатам»). */
  roomIndex?: number;
  /** Площадь, м². Для «по м²» обязательна, для «по комнатам» — по желанию. */
  area?: number;
  /** id отмеченных допуслуг. */
  extras?: string[];
  /** Скидка за регулярность: 0 / 0.1 / 0.15. */
  regularRate?: number;
  firstOrder?: boolean;
}

export interface Quote {
  /** Итог, округлённый до 10 ₽. null — не хватает данных (нет площади для «по м²»). */
  total: number | null;
  /** Строки расчёта для показа клиенту. */
  lines: string[];
}

export const rub = (n: number): string => `${Math.round(n).toLocaleString('ru-RU')} ₽`;

/**
 * Предварительный расчёт стоимости по правилам из брифа.
 *
 * По комнатам: цена за тип квартиры + доплата за м² сверх лимита + допуслуги + доплаты.
 * По м²:       площадь × цена за м² + допуслуги + доплаты, но не меньше минимальной суммы.
 * Процентные доплаты (животные) считаются от базовой суммы, без фиксированных допуслуг.
 * Скидки не суммируются — берётся бо́льшая.
 */
export function quote(input: QuoteInput): Quote {
  const { service, roomIndex = 0, area = 0, extras = [], regularRate = 0, firstOrder = false } = input;
  const p = service.pricing;
  const lines: string[] = [];
  let base: number;

  if (p.mode === 'rooms') {
    const room = p.rooms[roomIndex] ?? p.rooms[0]!;
    base = room.price;
    lines.push(`${room.label}: ${rub(room.price)}`);
    if (area > room.limit) {
      const extraM2 = area - room.limit;
      const add = extraM2 * p.overPerM2;
      base += add;
      lines.push(`+${Math.round(extraM2)} м² сверх лимита: ${rub(add)}`);
    }
  } else {
    if (!area || area <= 0) {
      return { total: null, lines: [`${p.ratePerM2} ₽/м², минимальный заказ ${rub(p.min)}`] };
    }
    base = area * p.ratePerM2;
    lines.push(`${area} м² × ${p.ratePerM2} ₽: ${rub(base)}`);
  }

  let total = base;
  for (const id of extras) {
    const e = EXTRAS.find((x) => x.id === id);
    if (!e) continue;
    const add = e.kind === 'fixed' ? e.amount : base * e.rate;
    total += add;
    lines.push(`${e.name}: +${rub(add)}`);
  }

  if (p.mode === 'm2' && total < p.min) {
    total = p.min;
    lines.push(`Минимальный заказ: ${rub(p.min)}`);
  }

  const allowedRegular = service.regular ? regularRate : 0;
  const allowedFirst = service.firstOrder && firstOrder ? DISCOUNTS.firstOrder : 0;
  const discount = Math.max(allowedRegular, allowedFirst);
  if (discount > 0) {
    lines.push(`Скидка ${Math.round(discount * 100)}%: −${rub(total * discount)}`);
    total *= 1 - discount;
  }

  return { total: Math.round(total / 10) * 10, lines };
}
