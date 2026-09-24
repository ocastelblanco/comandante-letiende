export type Unsubscribe = () => void;
export type ListenerState = 'idle' | 'live' | 'failed';

export interface ResilientListenerOptions {
  /** Espera inicial antes del primer reintento. Se duplica en cada fallo consecutivo. */
  baseDelayMs?: number;
  /** Tope de la espera entre reintentos. */
  maxDelayMs?: number;
  /** Se llama con `true` al fallar el listener y con `false` al recibir datos de nuevo (o al desconectar). */
  onStatusChange?: (down: boolean) => void;
  onError?: (error: unknown) => void;
}

/**
 * Envuelve un listener de tiempo real (p. ej. `onSnapshot`) para que no muera en silencio.
 *
 * Cuando Firestore entrega un error definitivo (`permission-denied` por un token vencido o un
 * cierre de sesión, `resource-exhausted`, error interno…) cancela el listener para siempre y
 * la pantalla se queda "congelada" con el último estado. Aquí el error se registra, se avisa
 * por `onStatusChange` y se vuelve a suscribir con espera exponencial.
 *
 * No depende de Firebase: `subscribe` recibe los callbacks de datos y de error y devuelve la
 * función para cancelar. Eso lo hace probable con dobles y temporizadores falsos.
 */
export class ResilientListener<T> {
  private unsubscribe: Unsubscribe | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private attempts = 0;
  private generation = 0;
  private down = false;
  private currentState: ListenerState = 'idle';

  constructor(
    private readonly subscribe: (next: (value: T) => void, error: (e: unknown) => void) => Unsubscribe,
    private readonly onData: (value: T) => void,
    private readonly options: ResilientListenerOptions = {},
  ) {}

  get state(): ListenerState {
    return this.currentState;
  }

  /** Idempotente: no hace nada si ya está conectado o esperando un reintento. */
  connect(): void {
    if (this.currentState !== 'idle') return;
    this.open();
  }

  /** Cancela la suscripción y cualquier reintento pendiente. */
  disconnect(): void {
    this.generation++;
    this.cancelTimer();
    this.teardown();
    this.attempts = 0;
    this.currentState = 'idle';
    this.setDown(false);
  }

  /**
   * Si el listener está caído, reintenta ya en lugar de esperar el backoff.
   * Pensado para cuando el usuario vuelve a la pestaña o recupera la red.
   */
  reviveIfFailed(): void {
    if (this.currentState !== 'failed') return;
    this.cancelTimer();
    this.open();
  }

  private open(): void {
    const generation = ++this.generation;
    this.currentState = 'live';
    // Los callbacks de una suscripción anterior (ya cancelada) se ignoran.
    this.unsubscribe = this.subscribe(
      (value) => {
        if (generation !== this.generation) return;
        this.attempts = 0;
        this.setDown(false);
        this.onData(value);
      },
      (error) => {
        if (generation !== this.generation) return;
        this.fail(error);
      },
    );
  }

  private fail(error: unknown): void {
    this.teardown();
    this.currentState = 'failed';
    this.setDown(true);
    this.options.onError?.(error);

    const base = this.options.baseDelayMs ?? 1000;
    const max = this.options.maxDelayMs ?? 60000;
    const delay = Math.min(base * 2 ** this.attempts, max);
    this.attempts++;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.currentState === 'failed') this.open();
    }, delay);
  }

  private teardown(): void {
    const unsubscribe = this.unsubscribe;
    this.unsubscribe = null;
    try {
      unsubscribe?.();
    } catch {
      // Un listener ya terminado por error puede lanzar al cancelarse; no hay nada que hacer.
    }
  }

  private cancelTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private setDown(down: boolean): void {
    if (this.down === down) return;
    this.down = down;
    this.options.onStatusChange?.(down);
  }
}
