"use client";

export default function AnimatedArrow() {
  return (
    <div className="flex items-center justify-center my-8">
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-bounce"
      >
        <defs>
          <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f4bff" />
            <stop offset="100%" stopColor="#7c79ff" />
          </linearGradient>
        </defs>

        {/* Arrow shaft */}
        <path
          d="M32 8 L32 48"
          stroke="url(#arrowGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          className="animate-[pulse_2s_ease-in-out_infinite]"
        />

        {/* Arrow head */}
        <path
          d="M20 36 L32 48 L44 36"
          stroke="url(#arrowGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="animate-[pulse_2s_ease-in-out_infinite]"
        />

        {/* Glow effect */}
        <circle
          cx="32"
          cy="48"
          r="8"
          fill="url(#arrowGradient)"
          opacity="0.3"
          className="animate-ping"
        />
      </svg>
    </div>
  );
}
