import { describe, expect, it } from 'vitest';
import { quote } from './pricing';
import { getService } from '../data/prices';

describe('quote — примеры из брифа', () => {
  it('поддерживающая 2-к 72 м² с собакой = 7 370 ₽', () => {
    const q = quote({ service: getService('maint'), roomIndex: 2, area: 72, extras: ['pets'] });
    expect(q.total).toBe(7370);
  });

  it('генеральная 55 м² с духовкой = 10 900 ₽', () => {
    const q = quote({ service: getService('general'), area: 55, extras: ['oven'] });
    expect(q.total).toBe(10900);
  });
});

describe('quote — правила', () => {
  it('по м²: не меньше минимального заказа', () => {
    expect(quote({ service: getService('general'), area: 20 }).total).toBe(6000);
  });

  it('по м² без площади — итог неизвестен', () => {
    expect(quote({ service: getService('office') }).total).toBeNull();
  });

  it('скидки не суммируются — берётся бо́льшая', () => {
    const q = quote({ service: getService('maint'), roomIndex: 0, regularRate: 0.1, firstOrder: true });
    expect(q.total).toBe(2980); // 3 500 − 15% = 2 975 → округление до 10
  });

  it('скидка за регулярность не применяется к услугам без неё', () => {
    expect(quote({ service: getService('renov'), area: 40, regularRate: 0.15 }).total).toBe(10000);
  });
});
