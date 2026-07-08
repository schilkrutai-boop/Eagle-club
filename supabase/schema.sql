-- Eagle Club — esquema Supabase (Postgres)
-- Ejecuta este archivo completo en el SQL Editor de tu proyecto Supabase.
-- Es re-ejecutable: crea lo que falte y siembra sin duplicar.

-- ---------- tablas ----------
create table if not exists bays (
  id   int primary key,
  name text not null
);

create table if not exists menu_items (
  id          text primary key,
  category    text not null,
  name        text not null,
  description text not null default '',
  price       int  not null check (price >= 0),
  allergens   text[] not null default '{}',
  emoji       text not null default '',
  tint        text not null default '#eee',
  available   boolean not null default true,
  stock       int  not null default 0 check (stock >= 0),
  sort        int  not null default 0
);

create table if not exists reservations (
  id         text primary key,
  bay_id     int  not null references bays(id),
  date       date not null,
  hour       int  not null,
  name       text not null,
  email      text not null default '',
  guests     int  not null default 1,
  total      int  not null default 0,
  donation   int  not null default 0,
  paid       boolean not null default true,
  created_at timestamptz not null default now(),
  unique (bay_id, date, hour)
);

create table if not exists orders (
  id         text primary key,
  number     int  not null,
  bay_id     int  not null references bays(id),
  items      jsonb not null,
  note       text not null default '',
  status     text not null default 'nuevo'
             check (status in ('nuevo','preparando','listo','entregado')),
  total      int  not null default 0,
  donation   int  not null default 0,
  paid       boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists orders_created_at_idx on orders (created_at);

create table if not exists settings (
  id            int primary key default 1 check (id = 1),
  bay_price     int  not null default 50000,
  notify_emails text[] not null default '{}'
);

create table if not exists email_log (
  id         text primary key,
  at         timestamptz not null default now(),
  recipients text[] not null default '{}',
  subject    text not null
);

create sequence if not exists orders_number_seq;

-- ---------- seed ----------
insert into bays (id, name)
select g, 'Bahía ' || g from generate_series(1,6) g
on conflict (id) do nothing;

insert into settings (id, bay_price, notify_emails)
values (1, 50000, array[
  'martin@schilkrut.app',
  'sofia@eagleclub.cl',
  'matias@eagleclub.cl',
  'nicolas@eagleclub.cl'
])
on conflict (id) do nothing;

insert into menu_items (id, category, name, description, price, allergens, emoji, tint, stock, sort) values
  ('tabla','Para picar','Tabla Eagle Club','Jamón serrano, quesos, aceitunas y frutos secos para compartir.',16900,array['Lácteos','Frutos secos'],'🧀','#F0E7D2',12,10),
  ('empanaditas','Para picar','Empanaditas de queso','6 unidades, masa crujiente y queso fundido.',7900,array['Gluten','Lácteos'],'🥟','#F2E3C8',24,11),
  ('alitas','Para picar','Alitas BBQ','8 alitas glaseadas en salsa BBQ ahumada.',9500,array['Soja'],'🍗','#EFD9C4',18,12),
  ('papas','Para picar','Papas trufadas','Papas rústicas, aceite de trufa y parmesano.',6900,array['Lácteos'],'🍟','#F4E9C9',30,13),
  ('ceviche','Para picar','Ceviche de reineta','Reineta fresca, limón de pica, cilantro y cebolla morada.',12900,array['Pescado'],'🐟','#DCEBE3',8,14),
  ('barrosluco','Sándwiches','Barros Luco','Posta rosada y queso fundido en pan frica.',11900,array['Gluten','Lácteos'],'🥪','#F2E0C6',15,20),
  ('italiano','Sándwiches','Churrasco italiano','Palta, tomate y mayonesa casera.',12500,array['Gluten','Huevo'],'🥖','#E7EBD4',15,21),
  ('club','Sándwiches','Club sándwich','Pollo, tocino, huevo y verduras en pan de molde.',12900,array['Gluten','Huevo'],'🥪','#F0E4CE',15,22),
  ('margarita','Pizzas','Pizza margarita','Salsa pomodoro, mozzarella fresca y albahaca.',10900,array['Gluten','Lácteos'],'🍕','#F3E1C9',10,30),
  ('pepperoni','Pizzas','Pizza pepperoni','Doble pepperoni y mozzarella sobre masa madre.',12400,array['Gluten','Lácteos'],'🍕','#F1DCC4',10,31),
  ('brownie','Dulce','Brownie con helado','Brownie tibio de chocolate con helado de vainilla.',6500,array['Gluten','Huevo','Lácteos','Frutos secos'],'🍫','#EAD9CD',12,40),
  ('cheesecake','Dulce','Cheesecake de maracuyá','Base de galleta y coulis de maracuyá.',6900,array['Gluten','Lácteos'],'🍰','#F5E9CF',10,41),
  ('jugo','Bebidas & Bar','Jugo natural','Naranja, frutilla o piña, recién exprimido.',4500,array[]::text[],'🧃','#F3E5C4',40,50),
  ('limonada','Bebidas & Bar','Limonada menta-jengibre','Limón de pica, menta fresca y jengibre.',4900,array[]::text[],'🍋','#EAF0D3',40,51),
  ('espresso','Bebidas & Bar','Café espresso','Blend de especialidad, doble shot.',3500,array[]::text[],'☕','#E9DCC9',60,52),
  ('cerveza','Bebidas & Bar','Cerveza artesanal 500cc','IPA o Golden de cervecería local.',6500,array['Gluten'],'🍺','#F2E4C0',36,53),
  ('aperol','Bebidas & Bar','Aperol Spritz','Aperol, espumante brut y soda.',8900,array[]::text[],'🍹','#F4DFC4',20,54),
  ('piscosour','Bebidas & Bar','Pisco sour','Receta de la casa, pisco transparente.',7900,array['Huevo'],'🥃','#EFEBD0',25,55),
  ('vino','Bebidas & Bar','Copa de Carmenere','Reserva del Valle de Colchagua.',6900,array[]::text[],'🍷','#EAD8D2',30,56),
  ('agua','Bebidas & Bar','Agua mineral','Con o sin gas, 500cc.',3000,array[]::text[],'💧','#E0EBE8',48,57)
on conflict (id) do nothing;

-- ---------- pedido atómico ----------
-- Valida stock, descuenta, asigna número e inserta el pedido en una sola
-- transacción con bloqueo de fila: dos bahías no pueden vender el mismo
-- inventario a la vez. Devuelve el pedido creado como jsonb.
-- p_items: [{"itemId":"ceviche","qty":2}, ...]
create or replace function place_order(
  p_bay_id   int,
  p_items    jsonb,
  p_note     text,
  p_donation int
) returns jsonb
language plpgsql
as $$
declare
  v_id       text := substr(md5(random()::text), 1, 10);
  v_number   int;
  v_total    int := 0;
  v_line     record;
  v_item     menu_items%rowtype;
  v_out_items jsonb := '[]'::jsonb;
begin
  if not exists (select 1 from bays where id = p_bay_id) then
    raise exception 'BAHIA_INEXISTENTE';
  end if;

  -- consolida cantidades por producto (enteras, > 0)
  for v_line in
    select (elem->>'itemId') as item_id,
           sum(floor((elem->>'qty')::numeric))::int as qty
    from jsonb_array_elements(p_items) elem
    where (elem->>'itemId') is not null
      and floor((elem->>'qty')::numeric) > 0
    group by (elem->>'itemId')
  loop
    select * into v_item from menu_items where id = v_line.item_id for update;
    if not found then
      continue;
    end if;
    if not v_item.available or v_item.stock <= 0 then
      raise exception 'AGOTADO:%', v_item.name;
    end if;
    if v_item.stock < least(v_line.qty, 20) then
      raise exception 'STOCK:%:%', v_item.name, v_item.stock;
    end if;

    update menu_items
      set stock = stock - least(v_line.qty, 20),
          available = case when stock - least(v_line.qty, 20) <= 0 then false else available end
      where id = v_item.id;

    v_total := v_total + v_item.price * least(v_line.qty, 20);
    v_out_items := v_out_items || jsonb_build_object(
      'itemId', v_item.id, 'name', v_item.name,
      'qty', least(v_line.qty, 20), 'price', v_item.price
    );
  end loop;

  if jsonb_array_length(v_out_items) = 0 then
    raise exception 'PEDIDO_VACIO';
  end if;

  v_number := nextval('orders_number_seq');
  v_total := v_total + greatest(coalesce(p_donation, 0), 0);

  insert into orders (id, number, bay_id, items, note, status, total, donation, paid, created_at)
  values (v_id, v_number, p_bay_id, v_out_items, coalesce(p_note,''), 'nuevo',
          v_total, greatest(coalesce(p_donation,0),0), true, now());

  return (select to_jsonb(o) from orders o where o.id = v_id);
end;
$$;

-- ---------- seguridad ----------
-- RLS activa y sin políticas públicas: el servidor (service_role) hace todas
-- las lecturas/escrituras y omite RLS; el cliente nunca toca las tablas
-- directamente (los avisos en vivo van por Realtime Broadcast, canal aparte).
alter table bays          enable row level security;
alter table menu_items    enable row level security;
alter table reservations  enable row level security;
alter table orders        enable row level security;
alter table settings      enable row level security;
alter table email_log     enable row level security;
