export default function SvgSymbols() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="monstera" viewBox="0 0 100 100">
        <path d="M50 95C50 70 48 50 50 28" stroke="#7dbb7a" strokeWidth="4" fill="none"/>
        <ellipse cx="30" cy="46" rx="22" ry="13" transform="rotate(-35 30 46)" fill="#4f9a63"/>
        <ellipse cx="70" cy="40" rx="22" ry="13" transform="rotate(30 70 40)" fill="#9ad07f"/>
        <ellipse cx="50" cy="22" rx="14" ry="18" fill="#4f9a63"/>
        <ellipse cx="32" cy="74" rx="17" ry="10" transform="rotate(-20 32 74)" fill="#9ad07f"/>
        <ellipse cx="68" cy="72" rx="17" ry="10" transform="rotate(20 68 72)" fill="#4f9a63"/>
      </symbol>
      <symbol id="rubber" viewBox="0 0 100 100">
        <path d="M50 96V30" stroke="#7dbb7a" strokeWidth="4"/>
        <ellipse cx="34" cy="36" rx="20" ry="11" transform="rotate(-55 34 36)" fill="#4f9a63"/>
        <ellipse cx="66" cy="44" rx="20" ry="11" transform="rotate(55 66 44)" fill="#9ad07f"/>
        <ellipse cx="50" cy="18" rx="12" ry="18" fill="#9ad07f"/>
        <ellipse cx="32" cy="70" rx="20" ry="11" transform="rotate(-40 32 70)" fill="#9ad07f"/>
        <ellipse cx="68" cy="72" rx="20" ry="11" transform="rotate(40 68 72)" fill="#4f9a63"/>
      </symbol>
      <symbol id="palm" viewBox="0 0 100 100">
        <path d="M50 96V30M50 58C32 52 18 60 8 78M50 58C68 52 82 60 92 78M50 44C34 34 22 38 14 52M50 44C66 34 78 38 86 52M50 30C44 18 40 12 36 6M50 30C56 18 60 12 64 6" stroke="#7dbb7a" strokeWidth="6" strokeLinecap="round" fill="none"/>
      </symbol>
      <symbol id="snake" viewBox="0 0 100 100">
        <path d="M36 96C28 60 34 30 42 6C52 36 54 66 52 96z" fill="#4f9a63"/>
        <path d="M52 96C52 62 60 34 68 12C76 42 70 70 64 96z" fill="#9ad07f"/>
        <path d="M22 96C18 76 18 60 24 44C34 62 36 80 34 96z" fill="#9ad07f"/>
      </symbol>
      <symbol id="bamboo" viewBox="0 0 100 100">
        <path d="M36 96V10M52 96V26M68 96V42" stroke="#7dbb7a" strokeWidth="5" fill="none"/>
        <ellipse cx="24" cy="30" rx="12" ry="5" transform="rotate(-30 24 30)" fill="#9ad07f"/>
        <ellipse cx="80" cy="46" rx="12" ry="5" transform="rotate(30 80 46)" fill="#9ad07f"/>
        <ellipse cx="46" cy="18" rx="12" ry="5" transform="rotate(25 46 18)" fill="#4f9a63"/>
        <ellipse cx="60" cy="34" rx="12" ry="5" transform="rotate(-25 60 34)" fill="#4f9a63"/>
      </symbol>
      <symbol id="olive" viewBox="0 0 100 100">
        <path d="M50 96V58" stroke="#b08a5e" strokeWidth="6"/>
        <circle cx="50" cy="36" r="27" fill="#4f9a63"/>
        <circle cx="32" cy="46" r="16" fill="#9ad07f"/>
        <circle cx="68" cy="44" r="16" fill="#9ad07f"/>
      </symbol>
      <symbol id="flowers" viewBox="0 0 100 100">
        <path d="M50 92V56M40 92L32 66M60 92L70 62" stroke="#7dbb7a" strokeWidth="3" fill="none"/>
        <circle cx="50" cy="50" r="10" fill="#f0b5c2"/>
        <circle cx="31" cy="60" r="8" fill="#f0b5c2"/>
        <circle cx="71" cy="56" r="8" fill="#f6d28a"/>
        <ellipse cx="42" cy="80" rx="9" ry="4" fill="#9ad07f"/>
        <ellipse cx="60" cy="82" rx="9" ry="4" fill="#9ad07f"/>
      </symbol>
      <symbol id="pothos" viewBox="0 0 100 100">
        <path d="M30 20C20 50 30 70 24 94M50 20C56 50 46 70 54 94M70 20C80 46 72 70 78 92" stroke="#7dbb7a" strokeWidth="3" fill="none"/>
        <g fill="#9ad07f">
          <ellipse cx="22" cy="44" rx="8" ry="5"/>
          <ellipse cx="28" cy="72" rx="8" ry="5"/>
          <ellipse cx="56" cy="50" rx="8" ry="5"/>
          <ellipse cx="52" cy="80" rx="8" ry="5"/>
          <ellipse cx="78" cy="56" rx="8" ry="5"/>
        </g>
        <g fill="#4f9a63">
          <ellipse cx="32" cy="30" rx="8" ry="5"/>
          <ellipse cx="60" cy="30" rx="8" ry="5"/>
          <ellipse cx="74" cy="34" rx="8" ry="5"/>
        </g>
      </symbol>
      <symbol id="pot" viewBox="0 0 100 100">
        <path d="M18 34h64l-8 56H26z" fill="var(--pc,#c9c6bd)"/>
        <rect x="14" y="26" width="72" height="12" rx="5" fill="var(--pc,#c9c6bd)"/>
        <rect x="14" y="26" width="72" height="12" rx="5" fill="#000" opacity=".1"/>
      </symbol>
      <symbol id="heart" viewBox="0 0 24 24">
        <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.6 4.5 6.3 4.5c2.1 0 3.9 1.2 5.7 3.3 1.8-2.1 3.6-3.3 5.7-3.3 3.7 0 5.4 3.9 3.9 7.3C19.5 16.4 12 21 12 21z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      </symbol>
    </svg>
  );
}
