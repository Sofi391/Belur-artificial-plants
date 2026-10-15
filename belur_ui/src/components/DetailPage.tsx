"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SvgSymbols from "@/components/SvgSymbols";
import { fetchPlantBySlug, fetchPotBySlug, type Item, type SuggestedPot } from "@/lib/api";
import { sz, fmt } from "@/lib/data";

type Picks = Record<number, number>;
function loadPicks(): Picks { try { return JSON.parse(localStorage.getItem("belur-picks") || "{}"); } catch { return {}; } }
function savePicks(p: Picks) { try { localStorage.setItem("belur-picks", JSON.stringify(p)); } catch { /* noop */ } }

// ─── SVG fallback art ─────────────────────────────────────────────────────────
// Shown when the API returns no images for an item, or when an image URL fails.
// Permanent fallback — always here for graceful degradation.
function SvgArt({ a, c }: { a: string; c?: string }) {
  return (
    <svg style={{ "--pc": c || "" } as React.CSSProperties}>
      <use href={`#${a}`} />
    </svg>
  );
}

// ─── Single slot image with SVG fallback ──────────────────────────────────────
// Uses a `key` prop from the parent to reset broken state when src changes
// (switching gallery slots), avoiding a useEffect + setState pattern.
function SlotImage({ src, alt, a, c }: { src: string; alt: string; a: string; c?: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return <SvgArt a={a} c={c} />;
  return <img src={src} alt={alt} onError={() => setBroken(true)} />;
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
// Uses item.imgs[] from the API (up to 3 slots, sort_order 0–2).
// If imgs is empty (images not wired on backend yet), shows 3 SVG fallback slots.
function Gallery({ item }: { item: Item }) {
  const [active, setActive] = useState(0);

  // Always show 3 slots — fill with "" if API hasn't returned images yet
  const slots: string[] = item.imgs.length > 0
    ? [...item.imgs, ...Array(Math.max(0, 3 - item.imgs.length)).fill("")]
    : ["", "", ""];

  return (
    <div className="det-gallery">
      <div className="det-main-img">
        <div className="det-main-art">
          {/* key=src resets the broken state in SlotImage when the slot changes */}
          <SlotImage key={slots[active]} src={slots[active]} alt={item.n} a={item.a} c={item.c} />
        </div>
        <div className="det-slot-dots">
          {slots.map((_, i) => (
            <button key={i} className={`det-slot-dot${active === i ? " on" : ""}`} aria-label={`Photo ${i + 1}`} onClick={() => setActive(i)} />
          ))}
        </div>
      </div>
      <div className="det-thumbs">
        {slots.map((src, i) => (
          <button key={i} className={`det-thumb${active === i ? " on" : ""}`} onClick={() => setActive(i)} aria-label={`View photo ${i + 1}`}>
            <div className="det-thumb-art">
              <SlotImage key={src + i} src={src} alt={`${item.n} ${i + 1}`} a={item.a} c={item.c} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Suggested pot thumbnail ──────────────────────────────────────────────────
function SuggestedPotImage({ pot }: { pot: SuggestedPot }) {
  const [broken, setBroken] = useState(false);
  if (!pot.img || broken) return <SvgArt a={pot.a} c={pot.c} />;
  return <img src={pot.img} alt={pot.name} onError={() => setBroken(true)} />;
}

// ─── Ambient background — identical to home page ──────────────────────────────
// Defined outside DetailPage so it is not recreated on every render.
function Ambient() {
  return (
    <>
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
        </g>
        <g className="sw2">
          <path d="M1260 40C1150-60 980-30 920 90C990 200 1150 210 1260 40z" fill="url(#j2)"/>
          <path d="M1250 280C1140 190 970 220 930 330C1000 430 1160 430 1250 280z" fill="url(#j1)"/>
          <path d="M1260 540C1150 450 1000 480 960 590C1030 690 1180 680 1260 540z" fill="url(#j3)"/>
        </g>
        <g className="sw1">
          <path d="M300 830C320 700 380 640 470 600C470 700 420 780 300 830z" fill="url(#j2)"/>
          <path d="M820 830C850 720 920 670 1010 650C990 750 920 810 820 830z" fill="url(#j1)"/>
        </g>
      </svg>
      <div className="rays"/>
    </>
  );
}

// ─── Nav — defined outside DetailPage so it is not recreated on every render ──
function DetailNav({ onHome, onBack }: { onHome: () => void; onBack: () => void }) {
  return (
    <nav>
      <div className="wrap">
        <button className="brand" aria-label="BELUR home" onClick={onHome}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#245a43" strokeWidth="1.8">
            <path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19c3-5 6-8 10-10"/>
          </svg>
          BELUR
        </button>
        <button className="det-back" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
      </div>
    </nav>
  );
}

// ─── Main detail page ─────────────────────────────────────────────────────────
export default function DetailPage({ slug, kind }: { slug: string; kind: "plant" | "pot" }) {
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  // Lazy initializer — reads localStorage once on mount, no useEffect needed
  const [picks, setPicks] = useState<Picks>(loadPicks);

  useEffect(() => {
    const fetcher = kind === "plant" ? fetchPlantBySlug : fetchPotBySlug;
    fetcher(slug)
      .then((data) => setItem(data))
      .catch((e: unknown) => setApiError(e instanceof Error ? e.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, [slug, kind]);

  const togglePick = () => {
    if (!item) return;
    setPicks((prev) => {
      const next = { ...prev };
      if (next[item.id]) delete next[item.id]; else next[item.id] = 1;
      savePicks(next); return next;
    });
  };

  const goHome = () => router.push("/");
  const goBack = () => router.back();

  if (loading) return (
    <>
      <SvgSymbols /><Ambient /><DetailNav onHome={goHome} onBack={goBack} />
      <div className="det-not-found"><p>Loading…</p></div>
    </>
  );

  if (apiError || !item) return (
    <>
      <SvgSymbols /><Ambient /><DetailNav onHome={goHome} onBack={goBack} />
      <div className="det-not-found">
        <p>{apiError || "Item not found."}</p>
        <button className="btn" onClick={goBack}>← Go back</button>
      </div>
    </>
  );

  const picked = !!picks[item.id];
  // Suggested pots come from the API's suggested_pots field (PlantDetailSerializer).
  const suggestedPots = item.suggestedPots ?? [];

  const waMsg = `Hello, I'm interested in the ${item.n} (${fmt(item.p)} ETB). Could you give me more details?`;

  return (
    <>
      <SvgSymbols />
      <Ambient />
      <DetailNav onHome={goHome} onBack={goBack} />

      <main className="wrap det-wrap">
        <div className="det-layout">

          {/* LEFT — gallery */}
          <Gallery item={item} />

          {/* RIGHT — info */}
          <div className="det-info">

            <div className="det-crumb">
              <span onClick={goHome} style={{ cursor: "pointer" }}>
                {item.k === "plant" ? "Plants" : "Pots"}
              </span>
              <span className="det-crumb-sep">›</span>
              <span>{item.t}</span>
            </div>

            <div className="det-title-row">
              <div>
                <h1 className="det-name">{item.n}</h1>
                {item.l && <p className="det-local">{item.l}</p>}
              </div>
              {!item.in && <span className="det-oos-badge">Out of stock</span>}
            </div>

            <p className="det-price">{fmt(item.p)} <span>ETB</span></p>

            <div className="det-meta-row">
              {item.t && <span className="det-meta-chip">{item.t}</span>}
              {item.s != null && <span className="det-meta-chip">{sz(item.s)}</span>}
              {item.pi ? <span className="det-meta-chip">Pot included</span> : null}
              {item.k === "plant" && !item.pi && <span className="det-meta-chip">Pot sold separately</span>}
            </div>

            <p className="det-desc">{item.d}</p>

            <div className="det-tags-row">
              {item.g.map((t) => <span key={t} className="det-tag">{t}</span>)}
            </div>

            {item.in ? (
              <button className={`det-pick-btn${picked ? " picked" : ""}`} onClick={togglePick} aria-pressed={picked}>
                <svg width="20" height="20"><use href="#heart"/></svg>
                {picked ? "Saved to my picks" : "Add to my picks"}
              </button>
            ) : null}

            {/* Enquire directly — same .send style as the My Picks drawer */}
            <div className="det-contact">
              <button
                className="send"
                style={{ background: "#1f9d55", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                onClick={() => window.open(`https://wa.me/251900000000?text=${encodeURIComponent(waMsg)}`)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L.057 23.882l6.198-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.68.859.875-3.593-.234-.369A9.818 9.818 0 1112 21.818z"/>
                </svg>
                Send via WhatsApp
              </button>
              <button
                className="send"
                style={{ background: "#2a8fd0", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                onClick={() => {
                  navigator.clipboard?.writeText(waMsg);
                  alert("Message copied. Paste it in the chat.");
                  window.open("https://t.me/fiamiso");
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.9l-2.965-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.963.659z"/>
                </svg>
                Copy and open Telegram
              </button>
            </div>

            {/* Suggested pots — from API's suggested_pots field on PlantDetailSerializer */}
            {suggestedPots.length > 0 && (
              <div className="det-suggested">
                <p className="det-suggested-label">Pairs well with</p>
                <div className="det-suggested-list">
                  {suggestedPots.map((pot) => (
                    <button key={pot.id} className="det-sug-card" onClick={() => router.push(`/pots/${pot.slug}`)}>
                      <div className="det-sug-art">
                        <SuggestedPotImage pot={pot} />
                      </div>
                      <span className="det-sug-name">{pot.name}</span>
                      <span className="det-sug-price">{fmt(pot.price)} ETB</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
