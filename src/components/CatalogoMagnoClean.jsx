import React, { useEffect, useMemo, useState } from "react";
import products from "../data/products.json";

/* ☎️ WhatsApp (solo 33; principal primero) */
const CONTACTS = [
  { label: "3313620333", href: "https://wa.me/5213313620333" }, // principal
  { label: "3327606138", href: "https://wa.me/5213327606138" },
];

/* 🎨 Colores corporativos por categoría (HEX) */
const COLOR_BY_CATEGORY = {
  Prelavadores: "#EFB81C",
  Enjuagues: "#747474",
  Desmanchadores: "#5FA154",
  "All Purpose / Multiusos": "#8E5FA8",
  Aditivos: "#7C3AED",
  "Control de olores": "#E7C736",
  Pisos: "#E9A6AD",
  Shampoos: "#0083C4",
  Desinfectantes: "#E57E26",
  Complementos: "#93B7D6",
  "Protectores de tela": "#69B5A6",
  "Piel y Vinilo": "#754222",
  Automotriz: "#2E2C79",
};

/* Alias cortos para el slide */
const DISPLAY_NAME = {
  "All Purpose / Multiusos": "APC",
  "Protectores de tela": "Protectores",
  "Control de olores": "Olores",
  "Piel y Vinilo": "Piel/Vinilo",
  Desinfectantes: "Desinfect.",
  Automotriz: "Auto",
};
const displayName = (cat) => DISPLAY_NAME[cat] || cat;

/* Util: color de texto según fondo */
const textOn = (hex) => {
  const n = hex.replace("#", "");
  const v = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
  const i = parseInt(v, 16);
  const r = (i >> 16) & 255, g = (i >> 8) & 255, b = i & 255;
  const L = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
  const lum = 0.2126 * L(r) + 0.7152 * L(g) + 0.0722 * L(b);
  return lum > 0.5 ? "#0f172a" : "#ffffff";
};

/* ---------- Carrito ---------- */
function useCart() {
  const [items, setItems] = useState([]); // {name, category, size, code, price, qty}

  const add = (prod, variant, qty = 1) => {
    if (!variant) return;
    setItems((prev) => {
      const key = `${prod.name}-${variant.code}`;
      const idx = prev.findIndex((x) => `${x.name}-${x.code}` === key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [
        ...prev,
        {
          name: prod.name,
          category: prod.category,
          size: variant.size,
          code: variant.code,
          price: Number(variant.price) || 0,
          qty,
        },
      ];
    });
  };

  const addLines = (lines) => { lines.forEach((ln) => add(ln.prod, ln.variant, ln.qty || 1)); };

  const updateQty = (key, qty) =>
    setItems((prev) =>
      prev
        .map((x) => (`${x.name}-${x.code}` === key ? { ...x, qty: Math.max(1, qty) } : x))
        .filter((x) => x.qty > 0)
    );

  const remove = (key) =>
    setItems((prev) => prev.filter((x) => `${x.name}-${x.code}` !== key));

  const clear = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((s, x) => s + (x.price || 0) * x.qty, 0),
    [items]
  );

  const toWhatsAppMessage = () => {
    const lines = items.map((x) => `• ${x.name} — ${x.size} (cód: ${x.code}) × ${x.qty}`);
    const header = "Hola, quisiera cotizar los siguientes productos:";
    const body = [header, "", ...lines, "", `Subtotal estimado: $${subtotal.toLocaleString("es-MX",{minimumFractionDigits:2})} MXN`].join("\n");
    return encodeURIComponent(body);
  };

  return { items, add, addLines, updateQty, remove, clear, subtotal, toWhatsAppMessage };
}

/* ---------- UI helpers ---------- */
function CategoryBadge({ category }) {
  const tone = COLOR_BY_CATEGORY[category] || "#1eae93";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ color: tone, backgroundColor: `${tone}1A`, border: `1px solid ${tone}55` }}
      title={category}
    >
      <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tone }} />
      {category}
    </span>
  );
}

function ChannelButton({ kind, href }) {
  const map = {
    ml:  { label: "Mercado Libre", bg: "#FFE600", fg: "#111827" },
    amz: { label: "Amazon",        bg: "#232F3E", fg: "#ffffff" },
    tt:  { label: "TikTok",        bg: "#111111", fg: "#ffffff" },
    wa:  { label: "WhatsApp",      bg: "#25D366", fg: "#ffffff" },
  };
  const ch = map[kind];
  if (!href || !ch) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: ch.bg, color: ch.fg }}
    >
      {ch.label}
    </a>
  );
}

/* ---------- Tarjeta de producto ---------- */
function VariantRow({ prod, v, onAdd }) {
  const [qty, setQty] = useState(1);
  return (
    <tr className="border-t border-neutral-100 align-middle">
      <td className="py-2 pr-3">
        <div className="flex items-center gap-3 whitespace-nowrap">
          {v.image && (
            <img
              src={v.image}
              alt={`${prod.name} ${v.size}`}
              className="h-10 w-10 rounded-md object-cover border border-neutral-200"
            />
          )}
          <span>{v.size}</span>
        </div>
      </td>
      <td className="py-2 pr-3 whitespace-nowrap font-mono text-[12px] text-neutral-700">
        {v.code}
      </td>
      <td className="py-2 pr-3 whitespace-nowrap font-semibold">
        ${Number(v.price || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
      </td>
      <td className="py-2 pr-3">
        <div className="inline-flex items-center rounded-lg border border-neutral-300 overflow-hidden">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-8 w-8 text-neutral-700 hover:bg-neutral-100">−</button>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
            className="h-8 w-14 text-center outline-none"
          />
          <button onClick={() => setQty((q) => q + 1)} className="h-8 w-8 text-neutral-700 hover:bg-neutral-100">+</button>
        </div>
      </td>
      <td className="py-2 pr-3">
        <button onClick={() => onAdd(prod, v, qty)} className="h-8 rounded-lg px-3 bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700">
          Agregar
        </button>
      </td>
      <td className="py-2">
        <div className="flex flex-wrap gap-1.5">
          <ChannelButton kind="ml"  href={v.channels?.ml} />
          <ChannelButton kind="amz" href={v.channels?.amz} />
          <ChannelButton kind="tt"  href={v.channels?.tt} />
        </div>
      </td>
    </tr>
  );
}

function ProductCard({ p, onAdd }) {
  const tone = COLOR_BY_CATEGORY[p.category] || "#1eae93";
  // Imagen de fallback al nivel de producto (si quieres poner una general)
  const productImage = p.image || (p.variants?.find(v => v.image)?.image) || "";

  return (
    <div className="group rounded-[var(--radius-card)] border bg-white shadow-sm hover:shadow-md transition overflow-hidden" style={{ borderColor: "#e2e8f0" }}>
      <div className="h-1 w-full" style={{ backgroundColor: tone }} />
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-4">
            {productImage && (
              <img src={productImage} alt={p.name} className="h-16 w-16 md:h-20 md:w-20 rounded-lg object-cover border border-neutral-200" />
            )}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-neutral-900">{p.name}</h3>
              {p.subtitle && <p className="text-sm text-neutral-600 mt-0.5">{p.subtitle}</p>}
            </div>
          </div>
          <CategoryBadge category={p.category} />
        </div>

        {p.appearance && (<p className="mt-3 text-sm text-neutral-700"><strong>Apariencia:</strong> {p.appearance}</p>)}
        {p.notes && (<p className="mt-1 text-sm text-neutral-700">{p.notes}</p>)}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[680px] w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="py-2 pr-3 font-medium">Presentación</th>
                <th className="py-2 pr-3 font-medium">Código</th>
                <th className="py-2 pr-3 font-medium">Precio (MXN)</th>
                <th className="py-2 pr-3 font-medium">Cantidad</th>
                <th className="py-2 pr-3 font-medium"></th>
                <th className="py-2 font-medium">Canales</th>
              </tr>
            </thead>
            <tbody>
              {(p.variants || []).map((v, i) => (
                <VariantRow key={i} prod={p} v={v} onAdd={onAdd} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Slide bar de categorías (stories) ---------- */
function CategoryStories({ categories, active, onPick }) {
  return (
    <div className="relative">
      <div className="flex items-end gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory px-1 py-2">
        {["Todas", ...categories].map((cat) => {
          const tone = COLOR_BY_CATEGORY[cat] || "#CBD5E1";
          const selected = active === cat || (active === "Todas" && cat === "Todas");
          const name = displayName(cat);
          return (
            <button
              key={cat}
              onClick={() => onPick(cat)}
              className="shrink-0 w-20 snap-start flex flex-col items-center"
              title={cat}
            >
              <span
                className={`h-14 w-14 rounded-full ring-2 ${selected ? "ring-neutral-900" : "ring-transparent"} shadow`}
                style={{ backgroundColor: `${tone}33` }}
              >
                <span className="h-full w-full rounded-full block" style={{ border: `6px solid ${tone}` }} />
              </span>
              <span className={`mt-1 text-[11px] leading-4 max-w-[72px] text-center ${selected ? "font-semibold" : ""} whitespace-nowrap overflow-hidden text-ellipsis`}>
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Combos (packs) ---------- */
const COMBOS = [
  {
    id: "combo-basico-upholstery",
    name: "Básico Tapicería",
    description: "Ruta rápida: Prelavador + Aditivo + Enjuague.",
    tone: COLOR_BY_CATEGORY["Prelavadores"],
    items: [
      { code: "PLFC1.5", size: "1.5 kg", qty: 1 },
      { code: "ABS2", size: "2 kg", qty: 1 },
      { code: "EMLF1", size: "1 L", qty: 1 },
    ],
  },
  {
    id: "combo-antiolores",
    name: "Elimina Olores",
    description: "Prelavador + Mata olores + Enjuague neutro.",
    tone: COLOR_BY_CATEGORY["Control de olores"],
    items: [
      { code: "PLLL1", size: "1 L", qty: 1 },
      { code: "COME1", size: "1 L", qty: 1 },
      { code: "EMLF1", size: "1 L", qty: 1 },
    ],
  },
  // 👇 NUEVO
  {
    id: "combo-auto-interiores-oz",
    name: "Auto Interiores & Plásticos (OZ)",
    description: "Limpieza neutra de interiores + restauración de plásticos.",
    tone: COLOR_BY_CATEGORY["Automotriz"],
    items: [
      { code: "APCN1",   size: "1 L",   qty: 1 },
      { code: "NAR150g", size: "150 g", qty: 1 },
      { code: "SC1",     size: "1 kg",  qty: 1 },
    ],
  },
];

/* Slider horizontal de combos + colapsable */
function CombosSection({ combos, onAddCombo, lookupVariant }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 pb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Combos recomendados</h2>
        <button onClick={() => setOpen((v) => !v)} className="text-sm font-semibold text-neutral-700 hover:underline">
          {open ? "▴ Ocultar" : "▾ Vista extendida"}
        </button>
      </div>

      {open && (
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
            {combos.map((combo) => (
              <div key={combo.id} className="shrink-0 snap-start w-full md:w-[520px]">
                <ComboCard combo={combo} onAddCombo={onAddCombo} lookupVariant={lookupVariant} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ComboCard({ combo, onAddCombo, lookupVariant }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3" style={{ backgroundColor: `${combo.tone}1A`, borderBottom: `1px solid ${combo.tone}55` }}>
        <h3 className="font-semibold" style={{ color: combo.tone }}>{combo.name}</h3>
        <p className="text-sm text-neutral-600">{combo.description}</p>
      </div>
      <div className="p-4 space-y-2">
        {combo.items.map((it, idx) => {
          const match = lookupVariant(it.code, it.size);
          return (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex-1 pr-2">
                <div className="font-medium">{match?.prod?.name || "Producto"}</div>
                <div className="text-neutral-600">{it.size} · <span className="font-mono">{it.code}</span></div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {match?.variant?.price != null ? `$${Number(match.variant.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"}
                </div>
                <div className="text-xs text-neutral-500">× {it.qty}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-4 border-t border-neutral-200">
        <button onClick={() => onAddCombo(combo)} className="w-full h-10 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700">
          Agregar pack al carrito
        </button>
      </div>
    </div>
  );
}

/* ---------- Guías de lavado ---------- */
const GUIDES = [
  {
    id: "ruta-profesional",
    title: "Lavado profesional (tapicería)",
    steps: [
      { label: "1. Prelavador", cat: "Prelavadores" },
      { label: "2. + Aditivo (opcional)", cat: "Aditivos" },
      { label: "3. Desmanchadores (si aplica)", cat: "Desmanchadores" },
      { label: "4. Mata olores", cat: "Control de olores" },
      { label: "5. Enjuague multifibras", cat: "Enjuagues" },
      { label: "6. Protección (Repel / Apply Wet)", cat: "Protectores de tela" },
    ],
  },
  {
    id: "ruta-ph-neutro",
    title: "Lavado pH neutro (muebles / delicados)",
    steps: [
      { label: "1. Prelavador neutro", cat: "Prelavadores" },
      { label: "2. Desmanchador Directo", cat: "Desmanchadores" },
      { label: "3. Enjuague neutro", cat: "Enjuagues" },
      { label: "4. Shampoo neutro", cat: "Shampoos" },
      { label: "5. Protección", cat: "Protectores de tela" },
    ],
  },
];
function FooterStamp() {
  const month = new Date().toLocaleString("es-MX", { month: "long" });
  const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 text-[13px] text-neutral-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <span>© Magno Clean · Catálogo</span>
        <span className="font-medium">Actualizado: {monthCap} 2025</span>
      </div>
    </footer>
  );
}

function GuideCard({ guide, onPickCategory }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-white shadow-sm p-4">
      <h3 className="font-semibold mb-3">{guide.title}</h3>
      <div className="flex flex-wrap gap-2">
        {guide.steps.map((s, i) => {
          const tone = COLOR_BY_CATEGORY[s.cat] || "#CBD5E1";
          return (
            <button
              key={i}
              onClick={() => onPickCategory(s.cat)}
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${tone}1A`, color: tone, border: `1px solid ${tone}55` }}
              title={s.cat}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --------- Filtros / Agrupación ---------- */
function useFiltered(products, query, cat, sort) {
  return useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    let list = [...products];

    if (q) {
      list = list.filter((p) => {
        const hay = [
          p.name, p.subtitle, p.category, p.appearance,
          ...(p.variants || []).map((v) => v.code),
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    if (cat && cat !== "Todas") list = list.filter((p) => p.category === cat);

    switch (sort) {
      case "nombre":
        list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "precio_asc":
        list.sort((a, b) => (a.variants?.[0]?.price ?? 0) - (b.variants?.[0]?.price ?? 0)); break;
      case "precio_desc":
        list.sort((a, b) => (b.variants?.[0]?.price ?? 0) - (a.variants?.[0]?.price ?? 0)); break;
      default: break;
    }
    return list;
  }, [products, query, cat, sort]);
}

function groupByCategory(list) {
  const map = new Map();
  list.forEach((p) => {
    if (!map.has(p.category)) map.set(p.category, []);
    map.get(p.category).push(p);
  });
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

/* --------- Drawer de carrito ---------- */
function CartDrawer({ open, onClose, cart, defaultWa = CONTACTS[0]?.href }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev || "";
    return () => (document.body.style.overflow = prev || "");
  }, [open]);

  const goWhatsApp = () => {
    const msg = cart.toWhatsAppMessage();
    const href = defaultWa ? `${defaultWa}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(href, "_blank");
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity z-[60] ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 z-[70] ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="h-full flex flex-col">
          <div
            className="border-b border-neutral-200 flex items-center justify-between"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)", paddingBottom: "12px", paddingLeft: "16px", paddingRight: "16px" }}
          >
            <h3 className="text-lg font-semibold">Tu cotización</h3>
            <button onClick={onClose} className="h-9 w-9 rounded-md hover:bg-neutral-100 flex items-center justify-center text-xl" aria-label="Cerrar carrito">×</button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {cart.items.length === 0 ? (
              <p className="text-neutral-600">Aún no agregas productos.</p>
            ) : (
              <ul className="space-y-3">
                {cart.items.map((x) => {
                  const key = `${x.name}-${x.code}`;
                  const tone = COLOR_BY_CATEGORY[x.category] || "#1eae93";
                  return (
                    <li key={key} className="rounded-lg border border-neutral-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{x.name}</p>
                          <p className="text-xs text-neutral-600">{x.size} · <span className="font-mono">{x.code}</span></p>
                          <p className="text-xs mt-1" style={{ color: tone }}>{x.category}</p>
                        </div>
                        <button onClick={() => cart.remove(key)} className="text-xs text-neutral-500 hover:underline">Quitar</button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-lg border border-neutral-300 overflow-hidden">
                          <button onClick={() => cart.updateQty(key, Math.max(1, x.qty - 1))} className="h-8 w-8 text-neutral-700 hover:bg-neutral-100">−</button>
                          <input type="number" min={1} value={x.qty} onChange={(e) => cart.updateQty(key, Math.max(1, Number(e.target.value || 1)))} className="h-8 w-14 text-center outline-none" />
                          <button onClick={() => cart.updateQty(key, x.qty + 1)} className="h-8 w-8 text-neutral-700 hover:bg-neutral-100">+</button>
                        </div>
                        <div className="text-sm font-semibold">
                          {(x.price * x.qty).toLocaleString("es-MX", { minimumFractionDigits: 2, style: "currency", currency: "MXN" })}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-neutral-600">Subtotal estimado</span>
              <span className="text-base font-semibold">
                {cart.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2, style: "currency", currency: "MXN" })}
              </span>
            </div>
            <button onClick={goWhatsApp} disabled={cart.items.length === 0} className="w-full h-11 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-50">
              Cotizar por WhatsApp
            </button>
            <p className="text-[11px] text-neutral-500 mt-2">
              * Próximamente: paquetería y pagos (Mercado Pago / PayPal).
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ---------- FAB carrito ---------- */
function FloatingCartButton({ count = 0, onClick, hidden = false }) {
  if (hidden) return null;
  return (
    <button
      onClick={onClick}
      aria-label="Abrir carrito"
      className="fixed z-[65] right-4 md:right-6 bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] md:bottom-6 bg-brand-600 text-white shadow-lg hover:bg-brand-700 active:scale-[.98] transition h-12 px-4 rounded-full flex items-center gap-2"
    >
      <span className="text-lg">🧺</span>
      <span className="text-sm font-semibold">Carrito</span>
      {count > 0 && (
        <span className="ml-2 h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-[11px] leading-5 text-center font-bold shadow">
          {count}
        </span>
      )}
    </button>
  );
}

/* --------- Componente principal --------- */
export default function CatalogoMagnoClean() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [sort, setSort] = useState("nombre");

  // grid y límites por viewport
  const [grid, setGrid] = useState(1);
  const [maxGrid, setMaxGrid] = useState(1);
  const calcMaxGrid = (w) => (w < 768 ? 1 : w < 1280 ? 2 : 3);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const cart = useCart();

  // Buscar producto+variante (para combos)
  const lookupVariant = (code, size) => {
    for (const p of products) {
      for (const v of p.variants || []) {
        if (v.code?.toLowerCase() === String(code).toLowerCase() && (!size || v.size === size)) {
          return { prod: p, variant: v };
        }
      }
    }
    return null;
  };

  const addCombo = (combo) => {
    const lines = combo.items
      .map((it) => {
        const m = lookupVariant(it.code, it.size);
        if (!m) return null;
        return { prod: m.prod, variant: m.variant, qty: it.qty || 1 };
      })
      .filter(Boolean);
    cart.addLines(lines);
    setDrawerOpen(true);
  };

  const filtered = useFiltered(products, query, category, sort);
  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);

  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      const m = calcMaxGrid(w);
      setMaxGrid(m);
      setGrid((g) => Math.min(g, m));
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  const ALL_CATEGORIES = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    []
  );

  // clases del grid para Tailwind
  const gridColsClass = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3" }[grid] || "md:grid-cols-3";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/diefezach/image/upload/v1759874368/logo_magno_clean_gmj5l1.png"
                alt="Magno Clean"
                className="h-9 w-9 rounded-xl object-contain bg-white"
              />
              <div>
                <p className="text-sm text-neutral-500 leading-none">Magno Clean · Catálogo 2025</p>
                <h1 className="text-lg md:text-xl font-semibold leading-tight">Compra Fácil</h1>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              {CONTACTS.map((c) => (
                <a key={c.label} href={c.href} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">
                  WhatsApp {c.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Nota de precios */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 text-[13px] text-amber-900">
          <strong>Importante:</strong> Pedidos por <strong>WhatsApp</strong> = precio público. Compras en <strong>Mercado Libre / Amazon / TikTok Shop</strong> incluyen <strong>+$50</strong> por comisiones de plataforma.
        </div>
      </div>

      {/* Controles */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-4 pb-2">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, código o categoría..."
              className="w-full h-11 rounded-xl border border-neutral-300 bg-white px-4 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full h-11 rounded-xl border border-neutral-300 bg-white px-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-500 ${category === "Todas" ? "font-semibold" : ""}`}
            >
              <option>Todas</option>
              {ALL_CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
            </select>
          </div>
          <div className="md:col-span-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full h-11 rounded-xl border border-neutral-300 bg-white px-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="nombre">Ordenar por nombre</option>
              <option value="precio_asc">Precio: menor a mayor</option>
              <option value="precio_desc">Precio: mayor a menor</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-center justify-end">
            <div className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 bg-white p-1">
              {[1, 2, 3].map((n) => {
                const allowed = n <= maxGrid;
                const selected = grid === n;
                return (
                  <button
                    key={n}
                    onClick={() => allowed && setGrid(n)}
                    disabled={!allowed}
                    title={allowed ? `${n}×` : "No disponible en este tamaño de pantalla"}
                    className={[
                      "h-9 w-9 rounded-lg text-sm font-medium transition",
                      selected && allowed ? "bg-neutral-900 text-white" : "",
                      !selected && allowed ? "text-neutral-700 hover:bg-neutral-100" : "",
                      !allowed ? "opacity-40 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {n}×
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Slide categorías */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-4">
        <CategoryStories categories={ALL_CATEGORIES} active={category} onPick={(c) => setCategory(c)} />
      </section>

      {/* Combos en slider + colapsable */}
      <CombosSection combos={COMBOS} onAddCombo={addCombo} lookupVariant={lookupVariant} />

      {/* Guías */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-8">
        <h2 className="text-lg font-semibold mb-3">Guías de lavado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GUIDES.map((g) => (<GuideCard key={g.id} guide={g} onPickCategory={(c) => setCategory(c)} />))}
        </div>
      </section>

      {/* Catálogo por categoría */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 pb-28">
        {grouped.length === 0 ? (
          <div className="text-center py-20 text-neutral-600">No se encontraron resultados.</div>
        ) : (
          grouped.map(([cat, items]) => {
            const tone = COLOR_BY_CATEGORY[cat] || "#1eae93";
            const fg = textOn(tone);
            return (
              <section key={cat} className="mb-8">
                <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between" style={{ backgroundColor: `${tone}1A`, border: `1px solid ${tone}55` }}>
                  <div className="flex items-center gap-3">
                    <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: tone }} />
                    <h3 className="text-lg md:text-xl font-semibold" style={{ color: tone }}>
                      {cat} <span className="ml-2 text-sm font-medium opacity-80" style={{ color: fg }}>({items.length})</span>
                    </h3>
                  </div>
                </div>

                <div className={`grid grid-cols-1 ${gridColsClass} gap-4 md:gap-6`}>
                  {items.map((p, i) => (<ProductCard key={`${p.name}-${i}`} p={p} onAdd={cart.add} />))}
                </div>
              </section>
            );
          })
        )}
      </main>

     {/* Footer */}
      <FooterStamp />
      
      {/* FAB Carrito + Drawer */}
      <FloatingCartButton count={cart.items.length} onClick={() => setDrawerOpen(true)} hidden={drawerOpen} />
      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} cart={cart} />
    </div>
  );
}