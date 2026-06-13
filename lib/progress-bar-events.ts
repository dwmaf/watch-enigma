type EventListener = () => void;
type Listeners = Record<string, EventListener[]>;

const emitter = {
  listeners: {} as Listeners,

  on(event: string, callback: EventListener): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  off(event: string, callback: EventListener): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== callback);
    }
  },

  emit(event: string): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener());
    }
  },
};

export const progressBarEvents = {
  start: () => emitter.emit('start'),
  finish: () => emitter.emit('finish'),
  emitter,
};