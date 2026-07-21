"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { label: "How it works", anchor: "#how" },
  { label: "Results", anchor: "#results" },
];

const SERVICES = [
  { name: "Outbound", tagline: "Multi-channel client acquisition" },
  { name: "Growth Accelerator", tagline: "Custom growth strategy" },
];

interface NavProps {
  homePrefix?: string;
}

export default function Nav({ homePrefix = "" }: NavProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md">
      <div className="relative flex items-stretch border-b border-ink">
        <Link
          href={homePrefix === "" ? "/" : homePrefix}
          className="relative flex items-center border-r border-ink px-5 py-3.5"
          aria-label="Outlio home"
        >
          <Image src="/outlio logo.png" alt="Outlio" width={50} height={20} priority className="object-contain rounded-lg" />
        </Link>

        <nav className="hidden items-center gap-8 px-8 text-[15px] font-medium md:flex">
          {LINKS.map((l) => (
            <Link key={l.label} href={`${homePrefix}${l.anchor}`} className="transition-colors hover:text-accent">
              {l.label}
            </Link>
          ))}

          {/* Services Dropdown */}
          <div
            className="relative group"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <Link
              href={`${homePrefix}#services`}
              className="flex items-center gap-1 transition-colors hover:text-accent"
            >
              Services
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </Link>

            {isDropdownOpen && (
              <div className="absolute left-0 top-full pt-2">
                <div
                  className="w-72 rounded-2xl border border-white/30 shadow-xl backdrop-blur-xl"
                  style={{
                    background: 'linear-gradient(160deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.65) 100%)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)'
                  }}
                >
                  <div className="p-2">
                    {SERVICES.map((service) => (
                      <Link
                        key={service.name}
                        href={`${homePrefix}#${service.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => setIsDropdownOpen(false)}
                        className="block w-full text-left rounded-xl p-4 transition-all hover:bg-white/40"
                      >
                        <div className="font-semibold text-ink">{service.name}</div>
                        <div className="mt-1 text-xs text-muted">{service.tagline}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link href="/explainers" className="transition-colors hover:text-accent">
            Motion Graphic Ads
          </Link>
        </nav>

        <div className="relative ml-auto flex items-stretch border-l border-ink">
          <span
            aria-hidden
            className="absolute -bottom-[6px] -left-[6px] z-10 size-[10px] rotate-45 bg-ink"
          />
          <Link
            href="https://calendly.com/blluemoon135791113/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-6 text-[15px] font-semibold transition-colors hover:bg-ink hover:text-cream"
          >
            Book a call
          </Link>
        </div>
      </div>
    </header>
  );
}
