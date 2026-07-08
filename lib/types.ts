export type Bay = {
  id: number;
  name: string;
};

export type MenuItem = {
  id: string;
  category: string;
  name: string;
  desc: string;
  price: number; // CLP
  allergens: string[];
  emoji: string;
  tint: string; // background tint for the photo tile
  available: boolean;
  stock: number; // unidades disponibles; 0 => agotado
};

export type Reservation = {
  id: string;
  bayId: number;
  date: string; // YYYY-MM-DD
  hour: number; // 10..22 (start of 1h block)
  name: string;
  email: string;
  guests: number;
  total: number; // CLP (valor bahía)
  donation: number; // CLP, aporte Water Is Life
  paid: boolean;
  createdAt: number;
};

export type OrderStatus = "nuevo" | "preparando" | "listo" | "entregado";

export type OrderItem = {
  itemId: string;
  name: string;
  qty: number;
  price: number;
};

export type Order = {
  id: string;
  number: number; // ticket number for the day
  bayId: number;
  items: OrderItem[];
  note: string;
  status: OrderStatus;
  total: number; // CLP, incluye donación
  donation: number; // CLP, aporte Water Is Life
  paid: boolean;
  createdAt: number;
};

export type Settings = {
  bayPrice: number; // CLP por hora
  notifyEmails: string[]; // reciben aviso de cada reserva y pedido
};

export type EmailLog = {
  id: string;
  at: number;
  to: string[];
  subject: string;
};

export type DB = {
  bays: Bay[];
  menu: MenuItem[];
  reservations: Reservation[];
  orders: Order[];
  orderSeq: number;
  settings: Settings;
  emails: EmailLog[];
};

export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 23; // last block starts at 22:00
export const DEFAULT_BAY_PRICE = 50000; // CLP por hora
export const MAX_DONATION = 100000;
