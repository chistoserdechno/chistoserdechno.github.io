import { useMemo, useState } from 'react';
import { SERVICES, EXTRAS, DISCOUNTS, type ServiceId } from '../../data/prices';
import { quote, rub } from '../../lib/pricing';
import { whatsappWithText } from '../../data/site';
import { selectService } from '../../lib/events';

/**
 * Калькулятор предварительной стоимости — React-остров.
 * Вся логика расчёта — в lib/pricing.ts (покрыта тестами), здесь только интерфейс.
 */
export default function Calculator() {
  const [serviceId, setServiceId] = useState<ServiceId>('maint');
  const [roomIndex, setRoomIndex] = useState(0);
  const [area, setArea] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [regularRate, setRegularRate] = useState(0);
  const [firstOrder, setFirstOrder] = useState(false);

  const service = SERVICES.find((s) => s.id === serviceId)!;
  const isRooms = service.pricing.mode === 'rooms';
  const areaNum = parseFloat(area) || 0;

  const result = useMemo(
    () => quote({ service, roomIndex, area: areaNum, extras, regularRate, firstOrder }),
    [service, roomIndex, areaNum, extras, regularRate, firstOrder],
  );

  const totalText =
    result.total !== null
      ? `от ${rub(result.total)}`
      : service.pricing.mode === 'm2' ? `от ${rub(service.pricing.min)}` : '—';

  const changeService = (id: ServiceId) => {
    setServiceId(id);
    setRoomIndex(0);
    const next = SERVICES.find((s) => s.id === id)!;
    if (!next.regular) setRegularRate(0);
    if (!next.firstOrder) setFirstOrder(false);
  };

  const toggleExtra = (id: string) =>
    setExtras((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));

  // Сообщение в WhatsApp с параметрами расчёта
  const roomLabel = isRooms && service.pricing.mode === 'rooms' ? `, ${service.pricing.rooms[roomIndex]!.label}` : '';
  const waText = `Здравствуйте! Хочу уточнить стоимость: ${service.name}${roomLabel}${areaNum ? `, ${areaNum} м²` : ''}. Калькулятор показал ${totalText}. Пришлю фото.`;

  return (
    <div className="calc">
      <div className="calc-form">
        <div>
          <span className="calc-label">Тип уборки</span>
          <div className="chips" role="radiogroup" aria-label="Тип уборки">
            {SERVICES.map((s) => (
              <label className="chip" key={s.id}>
                <input type="radio" name="calcType" checked={s.id === serviceId} onChange={() => changeService(s.id)} />
                <span>{s.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="calc-row">
          {service.pricing.mode === 'rooms' && (
            <div className="field">
              <label htmlFor="calcRooms">Квартира</label>
              <select id="calcRooms" value={roomIndex} onChange={(e) => setRoomIndex(+e.target.value)}>
                {service.pricing.rooms.map((r, i) => (
                  <option key={r.label} value={i}>{r.label} — {rub(r.price)}</option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="calcArea">{isRooms ? 'Площадь, м² (по желанию)' : 'Площадь, м²'}</label>
            <input id="calcArea" type="number" min={1} max={2000} inputMode="numeric" placeholder="например, 55"
              value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
        </div>

        {service.regular && (
          <div className="field">
            <label htmlFor="calcFreq">Как часто</label>
            <select id="calcFreq" value={regularRate} onChange={(e) => setRegularRate(+e.target.value)}>
              {DISCOUNTS.regular.map((d) => <option key={d.rate} value={d.rate}>{d.label}</option>)}
            </select>
          </div>
        )}

        <div>
          <span className="calc-label">Допуслуги и доплаты</span>
          <div className="chips">
            {EXTRAS.map((e) => (
              <label className="chip" key={e.id}>
                <input type="checkbox" checked={extras.includes(e.id)} onChange={() => toggleExtra(e.id)} />
                <span>{e.name} {e.kind === 'fixed' ? `+${rub(e.amount)}` : `+${e.rate * 100}%`}</span>
              </label>
            ))}
          </div>
        </div>

        {service.firstOrder && (
          <label className="consent calc-first">
            <input type="checkbox" checked={firstOrder} onChange={(e) => setFirstOrder(e.target.checked)} />
            <span>Это наша первая уборка у вас — скидка 15%</span>
          </label>
        )}
      </div>

      <div className="calc-result" aria-live="polite">
        <span className="calc-label">Предварительно</span>
        <div className="calc-total">{totalText}</div>
        <ul className="calc-lines">
          {result.total === null && <li>Введите площадь — посчитаем точнее</li>}
          {result.lines.map((l) => <li key={l}>{l}</li>)}
        </ul>
        <a className="btn btn-gold" href={whatsappWithText(waText)} target="_blank" rel="noopener">
          Уточнить по фото <svg aria-hidden="true"><use href="#i-wa" /></svg>
        </a>
        <a className="btn btn-ghost-light" href="#booking" onClick={() => selectService(service.formName)}>Забронировать</a>
        <small className="calc-note">Скидки не суммируются — применяем бо́льшую.</small>
      </div>
    </div>
  );
}
