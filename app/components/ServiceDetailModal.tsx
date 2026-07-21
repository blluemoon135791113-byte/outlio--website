"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface Service {
  name: string;
  tagline: string;
  description: string;
  badge?: string;
  included: string[];
  execution?: string[];
  perfectFor: string[];
  footer?: string;
}

interface ServiceDetailModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceDetailModal({ service, isOpen, onClose }: ServiceDetailModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("button")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel) {
        const focusables = panel.querySelectorAll<HTMLElement>("button, a[href]");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !service) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-[60] grid place-items-center bg-ink/40 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={service.name}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="modal-panel max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/60 p-8 shadow-2xl backdrop-blur-2xl sm:p-12"
        style={{
          background: 'linear-gradient(160deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.65) 100%)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)'
        }}
      >
        <div className="flex items-start justify-between gap-6 border-b border-ink/10 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {service.name}
              </h3>
              {service.badge && (
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
                  {service.badge}
                </span>
              )}
            </div>
            <p className="mt-3 text-xl font-medium leading-relaxed text-ink">{service.tagline}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-cream transition-colors hover:bg-accent"
          >
            <span aria-hidden>&times;</span>
          </button>
        </div>

        <p className="mt-6 text-base leading-relaxed text-muted">{service.description}</p>

        <div className="mt-8 space-y-8">
          {/* What's Included */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-accent">What's Included</h4>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {service.included.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-snug">
                  <span aria-hidden className="mt-[5px] size-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* How We Execute */}
          {service.execution && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-accent">How We Execute</h4>
              <ul className="mt-4 space-y-3">
                {service.execution.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-snug">
                    <span aria-hidden className="mt-[5px] size-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Perfect For */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-accent">Perfect For</h4>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {service.perfectFor.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-snug">
                  <span aria-hidden className="mt-[5px] size-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {service.footer && (
          <p className="mt-8 border-t border-ink/10 pt-6 text-base font-medium leading-relaxed text-ink/80">
            {service.footer}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="#book"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-semibold text-cream transition-colors hover:bg-accent"
          >
            Book a call <span aria-hidden>&rarr;</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-full border border-ink px-7 py-3.5 font-semibold transition-colors hover:bg-ink hover:text-cream"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
