"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SvgSymbols from "@/components/SvgSymbols";
import { fetchPlants, fetchPots, type Item } from "@/lib/api";
import { FEATURED_NAMES, sz, fmt } from "@/lib/data";

type Picks = Record<number, number>;
function loadPicks(): Picks { try { return JSON.parse(localStorage.getItem("belur-picks") || "{}"); } catch { return {}; } }
function savePicks(p: Picks) { try { localStorage.setItem("belur-picks", JSON.stringify(p)); } catch { /* noop */ } }

// ─── Card / carousel image with SVG fallback ─────────────────────────────────
// Shows item.img (API cover image — images[0] sorted by sort_order).
// Falls back to the SVG illustration when img is "" (API has no images yet)
// or when the <img> fires onError (broken URL, R2 not wired, etc.).
function ItemImage({ item }: { item: Item }) {
  const [broken, setBroken] = useState(false);
  if (!item.img || broken) {
    return (
      <svg style={{ "--pc": item.c || "" } as React.CSSProperties}>
        <use href={`#${item.a}`} />
      </svg>
    );
  }
  return <img src={item.img} alt={item.n} onError={() => setBroken(true)} />;
}

export default function Home() {
  const router = useRouter();

  // ── API data ────────────────────────────────────────────────────────────────
  const [plants, setPlants] = useState<Item[]>([]);
  const [pots, setPots] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    Promise.all([fetchPlants(), fetchPots()])
      .then(([p, o]) => { setPlants(p); setPots(o); })
      .catch((e) => setApiError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Featured: plants marked featured by the API, ordered by FEATURED_NAMES preference
  const featured = [
    ...FEATURED_NAMES.map((n) => plants.find((x) => x.n === n)).filter(Boolean) as Item[],
    ...plants.filter((x) => x.featured && !FEATURED_NAMES.includes(x.n)),
  ].slice(0, 5);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<"plant" | "pot">("plant");
  const [type, setType] = useState("");
  const [stockOnly, setStockOnly] = useState(false);
  const [sort, setSort] = useState("");
  const [q, setQ] = useState("");
  const [picks, setPicks] = useState<Picks>(loadPicks);
  const [panelOpen, setPanelOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fi, setFi] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const catRef = useRef<HTMLElement>(null);

  // ── Carousel ────────────────────────────────────────────────────────────────
  const show = useCallback((i: number) => {
    if (!featured.length) return;
    setFi(((i % featured.length) + featured.length) % featured.length);
  }, [featured.length]);

  const stopTimer = useCallback(() => { if (timerRef.current) clearInterval(timerRef.current); }, []);
  const playTimer = useCallback(() => {
    stopTimer();
    if (featured.length > 1 && !matchMedia("(prefers-reduced-motion:reduce)").matches)
      timerRef.current = setInterval(() => setFi((f) => (f + 1) % featured.length), 5000);
  }, [stopTimer, featured.length]);

  useEffect(() => { playTimer(); return stopTimer; }, [playTimer, stopTimer]);
  useEffect(() => {
    const onVis = () => document.hidden ? stopTimer() : playTimer();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [playTimer, stopTimer]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  // ── Picks ───────────────────────────────────────────────────────────────────
  const allItems = [...plants, ...pots];
  const togglePick = (id: number) => setPicks((prev) => {
    const next = { ...prev };
    if (next[id]) delete next[id]; else next[id] = 1;
    savePicks(next); return next;
  });
  const adjustPick = (id: number, delta: number) => setPicks((prev) => {
    const next = { ...prev };
    const v = (next[id] || 0) + delta;
    if (v < 1) delete next[id]; else next[id] = v;
    savePicks(next); return next;
  });

  // ── Catalog filter / sort ───────────────────────────────────────────────────
  const source = mode === "plant" ? plants : pots;
  let results = source.filter((x) => (!type || x.t === type) && (!stockOnly || x.in));
  const qs = q.trim().toLowerCase();
  if (qs) results = results.filter((x) => [x.n, x.l, x.t, sz(x.s), ...x.g].join(" ").toLowerCase().includes(qs));
  if (sort) results = [...results].sort((a, b) => sort === "asc" ? a.p - b.p : b.p - a.p);
  else results = [...results].sort((a, b) => b.in - a.in);

  const plantTypes = ["All", ...new Set(plants.map((x) => x.t))];
  const pickCount = Object.values(picks).reduce((a, b) => a + b, 0);
  const pickIds = Object.keys(picks).map(Number);
  const total = pickIds.reduce((a, i) => {
    const item = allItems.find((x) => x.id === i);
    return a + (item ? item.p * picks[i] : 0);
  }, 0);
  const filterCount = (type ? 1 : 0) + (stockOnly ? 1 : 0) + (sort ? 1 : 0);

  const msg = () =>
    "Hello, I'm interested in:\n" +
    pickIds.map((i) => {
      const item = allItems.find((x) => x.id === i);
      return item ? `- ${item.n} x${picks[i]} (${fmt(item.p * picks[i])} ETB)` : "";
    }).filter(Boolean).join("\n") +
    "\nTotal: " + fmt(total) + " ETB";

  const goMode = (m: "plant" | "pot") => {
    setMode(m); setType("");
    setTimeout(() => catRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const goDetail = (x: Item) => router.push(`/${x.k === "plant" ? "plants" : "pots"}/${x.slug}`);

  return (
    <>
      <SvgSymbols />

      {/* Ambient background */}
      <svg className="amb" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="j1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1b6b43"/><stop offset="1" stopColor="#63b36c"/></linearGradient>
          <linearGradient id="j2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#2e8a52"/><stop offset="1" stopColor="#a6d86f"/></linearGradient>
          <linearGradient id="j3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0d4a33"/><stop offset="1" stopColor="#3f9a63"/></linearGradient>
        </defs>
        <g className="sw1">
          <path d="M-60 80C40-40 220-20 290 110C230 220 70 230-60 80z" fill="url(#j1)"/>
          <path d="M-40 300C80 190 250 220 300 340C240 440 60 450-40 300z" fill="url(#j2)"/>
          <path d="M-30 520C70 430 220 450 270 560C210 660 60 670-30 520z" fill="url(#j3)"/>
          <path d="M-60 90C60 90 180 110 270 120M-40 310C80 310 190 330 285 345" stroke="#e4f6d2" strokeOpacity=".45" strokeWidth="3" fill="none"/>
          <g fill="#f08fb0"><circle cx="150" cy="630" r="15"/><circle cx="176" cy="612" r="15"/><circle cx="170" cy="645" r="15"/><circle cx="142" cy="604" r="15"/></g>
          <circle cx="158" cy="626" r="8" fill="#ffd86b"/>
        </g>
        <g className="sw2">
          <path d="M1260 40C1150-60 980-30 920 90C990 200 1150 210 1260 40z" fill="url(#j2)"/>
          <path d="M1250 280C1140 190 970 220 930 330C1000 430 1160 430 1250 280z" fill="url(#j1)"/>
          <path d="M1260 540C1150 450 1000 480 960 590C1030 690 1180 680 1260 540z" fill="url(#j3)"/>
          <path d="M1250 60C1130 80 1030 100 940 110M1240 300C1130 320 1030 340 945 340" stroke="#e4f6d2" strokeOpacity=".45" strokeWidth="3" fill="none"/>
          <g fill="#ff9d57"><circle cx="1040" cy="395" r="14"/><circle cx="1064" cy="378" r="14"/><circle cx="1060" cy="410" r="14"/><circle cx="1034" cy="372" r="14"/></g>
          <circle cx="1050" cy="392" r="7" fill="#ffe27a"/>
        </g>
        <g className="sw1">
          <path d="M300 830C320 700 380 640 470 600C470 700 420 780 300 830z" fill="url(#j2)"/>
          <path d="M820 830C850 720 920 670 1010 650C990 750 920 810 820 830z" fill="url(#j1)"/>
          <path d="M560 840C570 760 610 720 670 700C670 770 630 820 560 840z" fill="url(#j3)"/>
        </g>
      </svg>
      <div className="rays" />

      {/* NAV */}
      <nav>
        <div className="wrap">
          <button className="brand" aria-label="BELUR, back to top" onClick={() => {
            setMode("plant"); setType(""); setStockOnly(false); setSort(""); setQ("");
            setPanelOpen(false); scrollTo({ top: 0, behavior: "smooth" });
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#245a43" strokeWidth="1.8">
              <path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19c3-5 6-8 10-10"/>
            </svg>
            BELUR
          </button>
          <button className="tab" aria-pressed={mode === "plant" ? "true" : "false"} onClick={() => goMode("plant")}>Plants</button>
          <button className="tab" aria-pressed={mode === "pot" ? "true" : "false"} onClick={() => goMode("pot")}>Pots</button>
          <button className="picks" onClick={() => setDrawerOpen(true)} aria-label="Open my picks">
            <svg width="24" height="24"><use href="#heart"/></svg>
            <span className="picks-label">My picks</span> <span className="cnt">{pickCount}</span>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="wrap">
          <div className="txt">
            <span className="badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#c98a3e">
                <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/>
              </svg>
              Always green, zero upkeep
            </span>
            <h1>Premium indoor plants for calm, modern spaces.</h1>
            <p className="sub">Clear sizes and prices. Send your picks in one tap.</p>
            <div className="bar">
              <input id="q" type="search" placeholder="Search by name or size..." aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
              <button className="btn" aria-expanded={panelOpen} onClick={() => setPanelOpen((o) => !o)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
                Filter {filterCount > 0 && <span className="cnt">{filterCount}</span>}
              </button>
              <button className="btn dark" onClick={() => setDrawerOpen(true)}>
                <svg width="20" height="20"><use href="#heart"/></svg>
                My picks
              </button>
            </div>
            <div id="panel" className={panelOpen ? "open" : ""}>
              {mode === "plant" && (
                <div className="row" id="types">
                  {plantTypes.map((t) => (
                    <button key={t} className="chip" aria-pressed={(t === "All" ? "" : t) === type ? "true" : "false"} onClick={() => setType(t === "All" ? "" : t)}>{t}</button>
                  ))}
                </div>
              )}
              <div className="row">
                <label><input type="checkbox" checked={stockOnly} onChange={(e) => setStockOnly(e.target.checked)}/> In stock only</label>
                <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="">Featured order</option>
                  <option value="asc">Price: low to high</option>
                  <option value="desc">Price: high to low</option>
                </select>
                <button className="chip" onClick={() => { setType(""); setStockOnly(false); setSort(""); }}>Reset</button>
              </div>
            </div>
          </div>

          {/* FEATURED CAROUSEL */}
          <section className="feat" aria-roledescription="carousel" aria-label="Featured plants"
            onMouseEnter={stopTimer} onMouseLeave={playTimer} onFocus={stopTimer} onBlur={playTimer}
          >
            <div id="slides">
              {featured.length === 0 ? (
                // Loading / empty state — keeps the carousel area visible
                <div className="slide on">
                  <div className="cap"><div><small>Featured</small><b>Loading…</b></div></div>
                </div>
              ) : featured.map((x, i) => (
                <div key={x.id} className={`slide${i === fi ? " on" : ""}`} aria-hidden={i !== fi} style={{ cursor: "pointer" }} onClick={() => goDetail(x)}>
                  <div className="art"><ItemImage item={x} /></div>
                  <div className="sh"/>
                  <div className="cap">
                    <div>
                      <small>Featured</small>
                      <b>{x.n}</b>
                      <span>{[x.l, sz(x.s)].filter(Boolean).join(" · ")} · {fmt(x.p)} ETB</span>
                    </div>
                    <button className="heart" data-id={x.id} aria-pressed={!!picks[x.id] ? "true" : "false"} aria-label={`Add ${x.n} to my picks`} onClick={(e) => { e.stopPropagation(); togglePick(x.id); }}>
                      <svg width="22" height="22"><use href="#heart"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="dots" onClick={(e) => {
              const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-s]");
              if (b) { show(+b.dataset.s!); playTimer(); }
            }}>
              {featured.map((x, i) => (
                <button key={i} data-s={i} aria-label={`Show ${x.n}`} aria-current={i === fi ? "true" : "false"}/>
              ))}
            </div>
          </section>
        </div>
      </header>

      {/* CATALOG */}
      <main className="wrap" ref={catRef}>
        <h2>{mode === "plant" ? "Plants" : "Pots"}</h2>
        {apiError && <p className="none" style={{ color: "#8b2020" }}>Could not load from API: {apiError}</p>}
        <p className="count">{loading ? "Loading…" : `${results.length}${mode === "plant" ? " plants" : " pots"}`}</p>
        <div className="grid">
          {loading
            ? <p className="none">Loading…</p>
            : results.length === 0
              ? <p className="none">Nothing matches. Try clearing the search or filters.</p>
              : results.map((x) => <Card key={x.id} x={x} picked={!!picks[x.id]} onToggle={togglePick} onNavigate={goDetail}/>)
          }
        </div>
      </main>

      {/* VEIL */}
      <div id="veil" className={drawerOpen ? "open" : ""} onClick={() => setDrawerOpen(false)}/>

      {/* DRAWER */}
      <aside id="dr" className={drawerOpen ? "open" : ""} role="dialog" aria-label="My picks">
        <h2>My picks</h2>
        <ul id="list">
          {pickIds.length === 0
            ? <li>Nothing picked yet. Tap the heart on any item.</li>
            : pickIds.map((i) => {
                const item = allItems.find((x) => x.id === i);
                if (!item) return null;
                return (
                  <li key={i}>
                    <span>{item.n}</span>
                    <span className="q">
                      <button aria-label="Less" onClick={() => adjustPick(i, -1)}>-</button>
                      {picks[i]}
                      <button aria-label="More" onClick={() => adjustPick(i, 1)}>+</button>
                    </span>
                    <span>{fmt(item.p * picks[i])}</span>
                  </li>
                );
              })
          }
        </ul>
        <b>Total: {fmt(total)} ETB</b>
        <button className="send" style={{ background: "#1f9d55" }} onClick={() => {
          if (!pickIds.length) return;
          window.open("https://wa.me/251900000000?text=" + encodeURIComponent(msg()));
        }}>Send via WhatsApp</button>
        <button className="send" style={{ background: "#2a8fd0" }} onClick={() => {
          if (!pickIds.length) return;
          navigator.clipboard?.writeText(msg());
          alert("Message copied. Paste it in the chat.");
          window.open("https://t.me/fiamiso");
        }}>Copy and open Telegram</button>
        <button className="btn" style={{ justifyContent: "center" }} onClick={() => { setPicks({}); savePicks({}); }}>Clear all</button>
        <button className="btn" style={{ justifyContent: "center" }} onClick={() => setDrawerOpen(false)}>Close</button>
      </aside>
    </>
  );
}

function Card({ x, picked, onToggle, onNavigate }: { x: Item; picked: boolean; onToggle: (id: number) => void; onNavigate: (x: Item) => void }) {
  return (
    <article className={`card${x.in ? "" : " out"}`} style={{ cursor: "pointer" }} onClick={() => onNavigate(x)}>
      <div className="img">
        <ItemImage item={x} />
        <div className="tags">
          <span className="tag">{x.in ? (x.pi ? "Pot included" : x.t) : "Out of stock"}</span>
        </div>
        {x.in ? (
          <button className="heart" aria-pressed={picked ? "true" : "false"} aria-label={`Add ${x.n} to my picks`} onClick={(e) => { e.stopPropagation(); onToggle(x.id); }}>
            <svg width="20" height="20"><use href="#heart"/></svg>
          </button>
        ) : null}
      </div>
      <div className="body">
        <div className="top"><b>{x.n}</b><span className="price">{fmt(x.p)} ETB</span></div>
        <div className="meta">{[x.l, sz(x.s)].filter(Boolean).join(" · ") || "\u00a0"}</div>
        <p className="desc">{x.d}</p>
        <div className="pills">{x.g.map((t) => <span key={t}>{t}</span>)}</div>
      </div>
    </article>
  );
}
