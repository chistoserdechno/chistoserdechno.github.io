/**
 * Прайс «Чистосердечно» — единственный источник цен на сайте.
 * Из этого файла строятся карточки услуг, полный прайс и калькулятор.
 * Поменяли цену здесь — она поменялась везде.
 */

/** Цена «по комнатам»: фиксированная сумма за тип квартиры + доплата за м² сверх лимита. */
export interface RoomsPricing {
  mode: 'rooms';
  /** Тип квартиры, цена и лимит площади в м². */
  rooms: { label: string; price: number; limit: number }[];
  /** Доплата за каждый м² сверх лимита. */
  overPerM2: number;
}

/** Цена «по м²»: площадь × ставка, но не меньше минимального заказа. */
export interface AreaPricing {
  mode: 'm2';
  ratePerM2: number;
  min: number;
}

export type ServiceId = 'maint' | 'general' | 'renov' | 'daily' | 'office';

export interface Service {
  id: ServiceId;
  name: string;
  /** Как услуга называется в форме заявки. */
  formName: string;
  pricing: RoomsPricing | AreaPricing;
  /** Что входит — текст из брифа. */
  includes: string;
  /** Скидка за регулярность доступна (раз в неделю / раз в 2 недели). */
  regular?: boolean;
  /** Скидка на первый заказ доступна. */
  firstOrder?: boolean;
}

export const SERVICES: Service[] = [
  {
    id: 'maint',
    name: 'Поддерживающая уборка',
    formName: 'Поддерживающая уборка',
    pricing: {
      mode: 'rooms',
      overPerM2: 100,
      rooms: [
        { label: 'Студия (до 30 м²)', price: 3500, limit: 30 },
        { label: '1-к (до 45 м²)', price: 4500, limit: 45 },
        { label: '2-к (до 65 м²)', price: 6000, limit: 65 },
        { label: '3-к (до 85 м²)', price: 7500, limit: 85 },
      ],
    },
    includes:
      'Пыль на доступных поверхностях, полы, зеркала, кухня снаружи (фасады, столешница, плита), сантехника, вынос мусора, ковровые покрытия (сухая уборка)',
    regular: true,
    firstOrder: true,
  },
  {
    id: 'general',
    name: 'Генеральная уборка',
    formName: 'Генеральная уборка',
    pricing: { mode: 'm2', ratePerM2: 180, min: 6000 },
    includes:
      'Всё из поддерживающей + труднодоступные места, двери и плинтусы, кухонные шкафы снаружи, удаление налёта и жира, батареи, выключатели',
    firstOrder: true,
  },
  {
    id: 'renov',
    name: 'Уборка после ремонта',
    formName: 'Уборка после ремонта',
    pricing: { mode: 'm2', ratePerM2: 250, min: 8000 },
    includes:
      'Удаление строительной пыли со всех поверхностей, следов краски, клея и затирки, мытьё полов в несколько этапов, сантехника, вынос мелкого мусора',
  },
  {
    id: 'daily',
    name: 'Посуточные квартиры',
    formName: 'Уборка посуточной квартиры',
    pricing: {
      mode: 'rooms',
      overPerM2: 70,
      rooms: [
        { label: 'Студия (до 30 м²)', price: 2500, limit: 30 },
        { label: '1-к (до 45 м²)', price: 3000, limit: 45 },
        { label: '2-к (до 65 м²)', price: 3500, limit: 65 },
      ],
    },
    includes: 'Уборка между гостями, смена белья, мытьё посуды, проверка расходников, фотоотчёт для хозяина',
  },
  {
    id: 'office',
    name: 'Уборка офисов',
    formName: 'Уборка офиса',
    pricing: { mode: 'm2', ratePerM2: 90, min: 4000 },
    includes: 'Рабочие места, полы, санузел, кухонная зона, вынос мусора',
  },
];

/**
 * Допуслуги и доплаты.
 * ⚠ В брифе пока только два примера (духовка и животные) — дополните список.
 */
export type Extra =
  | { id: string; name: string; kind: 'fixed'; amount: number }
  | { id: string; name: string; kind: 'percent'; rate: number };

export const EXTRAS: Extra[] = [
  { id: 'oven', name: 'Духовка', kind: 'fixed', amount: 1000 },
  { id: 'pets', name: 'Животные в доме', kind: 'percent', rate: 0.1 },
];

/** Скидки. Не суммируются — применяется бо́льшая. */
export const DISCOUNTS = {
  firstOrder: 0.15,
  regular: [
    { label: 'Разово', rate: 0 },
    { label: 'Раз в 2 недели — скидка 10%', rate: 0.1 },
    { label: 'Раз в неделю — скидка 15%', rate: 0.15 },
  ],
} as const;

/** Минимальная цена услуги — для подписи «от …». */
export function startingPrice(s: Service): number {
  return s.pricing.mode === 'rooms' ? s.pricing.rooms[0]!.price : s.pricing.min;
}

export const getService = (id: ServiceId): Service => {
  const s = SERVICES.find((x) => x.id === id);
  if (!s) throw new Error(`Неизвестная услуга: ${id}`);
  return s;
};
