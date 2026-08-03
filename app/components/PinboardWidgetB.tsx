"use client";

export default function PinboardWidgetB() {
  return (
    <div className="absolute bottom-0 right-[3%] w-[460px]">
      {/* File Folder with Tab */}
      <div
        className="pinboard-gentle-sway relative h-[320px] w-full"
        style={{
          transform: 'rotate(-4deg)',
          transformOrigin: 'bottom right',
          animationDelay: '1.2s',
        }}
      >
        {/* Folder body with tab using clip-path */}
        <div
          className="absolute inset-0 p-9"
          style={{
            background: 'linear-gradient(180deg, #F0F1F3 0%, #E9EAEC 100%)',
            clipPath: 'polygon(0% 15%, 30% 15%, 32% 5%, 38% 0%, 100% 0%, 100% 100%, 0% 100%)',
            borderRadius: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,.05), 0 24px 56px rgba(0,0,0,.10)',
          }}
        >
          {/* Tab label */}
          <div className="absolute left-9 top-3 text-[15px] font-medium text-gray-900">
            100+ Integrations
          </div>

          {/* Three app-icon tiles in fanned arrangement */}
          <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-end">
            {/* Gmail - Back left */}
            <div
              className="relative z-10 flex h-[112px] w-[112px] items-center justify-center rounded-[26px] bg-white p-6"
              style={{
                transform: 'rotate(-8deg) translateX(18px)',
                boxShadow: '0 2px 4px rgba(0,0,0,.05), 0 12px 28px rgba(0,0,0,.12)',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.5 4.64 12 9.548l6.5-4.91 1.573-1.147C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
              </svg>
            </div>

            {/* Slack - Center front (highest) */}
            <div
              className="relative z-30 -mx-5 flex h-[128px] w-[128px] items-center justify-center rounded-[26px] bg-white p-6"
              style={{
                transform: 'rotate(0deg) translateY(-12px)',
                boxShadow: '0 2px 4px rgba(0,0,0,.05), 0 12px 28px rgba(0,0,0,.12)',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z" fill="#36C5F0"/>
                <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z" fill="#2EB67D"/>
                <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z" fill="#ECB22E"/>
              </svg>
            </div>

            {/* Google Calendar - Back right */}
            <div
              className="relative z-10 flex h-[112px] w-[112px] items-center justify-center rounded-[26px] bg-white p-6"
              style={{
                transform: 'rotate(8deg) translateX(-18px)',
                boxShadow: '0 2px 4px rgba(0,0,0,.05), 0 12px 28px rgba(0,0,0,.12)',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
                <path d="M17.5 3h-11A3.5 3.5 0 0 0 3 6.5v11A3.5 3.5 0 0 0 6.5 21h11a3.5 3.5 0 0 0 3.5-3.5v-11A3.5 3.5 0 0 0 17.5 3z" fill="#1A73E8"/>
                <path d="M17.5 21h-11A3.5 3.5 0 0 1 3 17.5V8h18v9.5a3.5 3.5 0 0 1-3.5 3.5z" fill="white"/>
                <path d="M6.5 3A3.5 3.5 0 0 0 3 6.5V8h18V6.5A3.5 3.5 0 0 0 17.5 3h-11z" fill="#1A73E8"/>
                <path d="M7 1v4M17 1v4" stroke="#1A73E8" strokeWidth="2" strokeLinecap="round"/>
                <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1A73E8">31</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
