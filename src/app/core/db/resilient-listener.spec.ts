import { ResilientListener } from './resilient-listener';

// Doble de `onSnapshot`: guarda los callbacks de cada suscripción para dispararlos a mano.
function fakeSource() {
  const subs: { next: (v: number) => void; error: (e: unknown) => void; cancelled: boolean }[] = [];
  const subscribe = (next: (v: number) => void, error: (e: unknown) => void) => {
    const sub = { next, error, cancelled: false };
    subs.push(sub);
    return () => {
      sub.cancelled = true;
    };
  };
  return { subs, subscribe };
}

describe('ResilientListener', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('entrega los datos y no reintenta mientras todo va bien', () => {
    const src = fakeSource();
    const data: number[] = [];
    const l = new ResilientListener<number>(src.subscribe, (v) => data.push(v));
    l.connect();
    src.subs[0].next(1);
    src.subs[0].next(2);
    expect(data).toEqual([1, 2]);
    expect(l.state).toBe('live');
    expect(src.subs.length).toBe(1);
  });

  it('connect() es idempotente', () => {
    const src = fakeSource();
    const l = new ResilientListener<number>(src.subscribe, () => undefined);
    l.connect();
    l.connect();
    expect(src.subs.length).toBe(1);
  });

  it('ante un error avisa, espera y se vuelve a suscribir con backoff exponencial', () => {
    const src = fakeSource();
    const status: boolean[] = [];
    const l = new ResilientListener<number>(src.subscribe, () => undefined, {
      baseDelayMs: 1000,
      maxDelayMs: 60000,
      onStatusChange: (d) => status.push(d),
    });
    l.connect();
    src.subs[0].error(new Error('permission-denied'));
    expect(l.state).toBe('failed');
    expect(status).toEqual([true]);
    expect(src.subs[0].cancelled).toBe(true);

    vi.advanceTimersByTime(999);
    expect(src.subs.length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(src.subs.length).toBe(2); // reintento 1 tras 1 s

    src.subs[1].error(new Error('again'));
    vi.advanceTimersByTime(1999);
    expect(src.subs.length).toBe(2);
    vi.advanceTimersByTime(1);
    expect(src.subs.length).toBe(3); // reintento 2 tras 2 s
  });

  it('el backoff respeta el tope', () => {
    const src = fakeSource();
    const l = new ResilientListener<number>(src.subscribe, () => undefined, {
      baseDelayMs: 1000,
      maxDelayMs: 3000,
    });
    l.connect();
    for (let i = 0; i < 5; i++) {
      src.subs[src.subs.length - 1].error(new Error('x'));
      vi.advanceTimersByTime(3000);
    }
    const before = src.subs.length;
    src.subs[before - 1].error(new Error('x'));
    vi.advanceTimersByTime(3000);
    expect(src.subs.length).toBe(before + 1); // nunca espera más de 3 s
  });

  it('al recibir datos tras un fallo apaga el aviso y reinicia el backoff', () => {
    const src = fakeSource();
    const status: boolean[] = [];
    const l = new ResilientListener<number>(src.subscribe, () => undefined, {
      baseDelayMs: 1000,
      onStatusChange: (d) => status.push(d),
    });
    l.connect();
    src.subs[0].error(new Error('x'));
    vi.advanceTimersByTime(1000);
    src.subs[1].error(new Error('x'));
    vi.advanceTimersByTime(2000);
    src.subs[2].next(7);
    expect(status).toEqual([true, false]);
    expect(l.state).toBe('live');

    src.subs[2].error(new Error('x'));
    vi.advanceTimersByTime(1000); // vuelve a 1 s, no a 4 s
    expect(src.subs.length).toBe(4);
  });

  it('reviveIfFailed() reintenta de inmediato y cancela el temporizador pendiente', () => {
    const src = fakeSource();
    const l = new ResilientListener<number>(src.subscribe, () => undefined, { baseDelayMs: 30000 });
    l.connect();
    src.subs[0].error(new Error('x'));
    l.reviveIfFailed();
    expect(src.subs.length).toBe(2);
    vi.advanceTimersByTime(60000);
    expect(src.subs.length).toBe(2); // el temporizador viejo no dispara una tercera suscripción
  });

  it('reviveIfFailed() no hace nada si el listener está sano o desconectado', () => {
    const src = fakeSource();
    const l = new ResilientListener<number>(src.subscribe, () => undefined);
    l.reviveIfFailed();
    expect(src.subs.length).toBe(0);
    l.connect();
    l.reviveIfFailed();
    expect(src.subs.length).toBe(1);
  });

  it('disconnect() cancela la suscripción y los reintentos, y se puede reconectar', () => {
    const src = fakeSource();
    const status: boolean[] = [];
    const l = new ResilientListener<number>(src.subscribe, () => undefined, {
      baseDelayMs: 1000,
      onStatusChange: (d) => status.push(d),
    });
    l.connect();
    src.subs[0].error(new Error('x'));
    l.disconnect();
    expect(l.state).toBe('idle');
    expect(status).toEqual([true, false]);
    vi.advanceTimersByTime(60000);
    expect(src.subs.length).toBe(1);

    l.connect(); // volver a iniciar sesión en la misma pestaña
    expect(src.subs.length).toBe(2);
    expect(l.state).toBe('live');
  });

  it('ignora callbacks de una suscripción ya cancelada', () => {
    const src = fakeSource();
    const data: number[] = [];
    const l = new ResilientListener<number>(src.subscribe, (v) => data.push(v));
    l.connect();
    l.disconnect();
    src.subs[0].next(99);
    src.subs[0].error(new Error('tardío'));
    expect(data).toEqual([]);
    expect(l.state).toBe('idle');
  });
});
