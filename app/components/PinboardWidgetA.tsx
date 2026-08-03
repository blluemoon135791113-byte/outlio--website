"use client";

export default function PinboardWidgetA() {
  return (
    <div className="absolute left-[3%] top-[5%] w-[320px] lg:w-[360px]">
      {/* Layer 1 - Back white sheet */}
      <div
        className="absolute left-0 top-0 h-[360px] w-[300px] rounded-2xl bg-white"
        style={{
          transform: 'rotate(-6deg)',
          boxShadow: '0 2px 4px rgba(0,0,0,.04), 0 16px 32px rgba(0,0,0,.06)',
          transformOrigin: 'top center',
        }}
      />

      {/* Layer 2 - Second white sheet (peeks out bottom-left) */}
      <div
        className="absolute left-[20px] top-[20px] h-[360px] w-[300px] rounded-2xl bg-white"
        style={{
          transform: 'rotate(3deg)',
          boxShadow: '0 2px 4px rgba(0,0,0,.04), 0 16px 32px rgba(0,0,0,.06)',
          transformOrigin: 'top center',
        }}
      />

      {/* Layer 3 - Yellow sticky note */}
      <div
        className="pinboard-gentle-sway absolute left-[10px] top-[10px] h-[300px] w-[280px] rounded-2xl p-7"
        style={{
          background: 'linear-gradient(180deg, #FBEB8F 0%, #F7E56B 100%)',
          transform: 'rotate(3deg)',
          transformOrigin: '50% 8%',
          boxShadow: '0 4px 8px rgba(0,0,0,.06), 0 20px 40px rgba(0,0,0,.10)',
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 98%, 98% 100%, 0% 100%)',
        }}
      >
        {/* Paper dimple around pin */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2"
          style={{
            background: 'radial-gradient(circle, rgba(0,0,0,.08) 0%, transparent 70%)',
          }}
        />

        {/* Handwritten text */}
        <div
          className="font-handwriting text-[19px] leading-[1.6] text-gray-900"
          style={{ fontFamily: "'Caveat', 'Gloria Hallelujah', cursive" }}
        >
          <p>
            Research first.
            <br />
            Written by hand.
            <br />
            Real conversations.
            <br />
            Real results.
          </p>
        </div>
      </div>

      {/* Layer 4 - THE PUSHPIN */}
      <div
        className="absolute left-1/2 top-[8px] z-20 -translate-x-1/2"
        style={{
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.25))',
        }}
      >
        <svg width="24" height="28" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Pin needle/shaft */}
          <rect x="10.5" y="16" width="3" height="12" rx="1.5" fill="#8B8B8B" />

          {/* Pin head - red sphere with highlights */}
          <defs>
            <radialGradient id="pinGradient" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#FF4D4D" />
              <stop offset="30%" stopColor="#E63939" />
              <stop offset="70%" stopColor="#CC2929" />
              <stop offset="100%" stopColor="#B31F1F" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="10" r="10" fill="url(#pinGradient)" />

          {/* Specular highlight */}
          <ellipse cx="8" cy="6" rx="4" ry="3" fill="rgba(255,255,255,0.4)" />
          <ellipse cx="7" cy="5" rx="2" ry="1.5" fill="rgba(255,255,255,0.6)" />
        </svg>
      </div>

      {/* Layer 5 - Blue checkmark tile (overlaps bottom-left) */}
      <div
        className="pinboard-gentle-sway absolute bottom-[40px] left-[15px] z-10 flex h-[140px] w-[140px] items-center justify-center rounded-[32px] bg-white"
        style={{
          transform: 'rotate(-3deg)',
          transformOrigin: 'center',
          boxShadow: '0 4px 8px rgba(0,0,0,.06), 0 24px 48px rgba(0,0,0,.14)',
          animationDelay: '0.5s',
        }}
      >
        <div
          className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #3B8BF6 0%, #2C7BF2 100%)',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
    </div>
  );
}
