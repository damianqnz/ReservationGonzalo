"use client";

import { useState } from "react";

interface GuestSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (adults: number, children: number) => void;
  initialAdults?: number;
  initialChildren?: number;
}

export default function GuestSelectionModal({
  open,
  onClose,
  onSave,
  initialAdults = 2,
  initialChildren = 0,
}: GuestSelectionModalProps) {
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);

  if (!open) return null;

  const handleSave = () => {
    onSave?.(adults, children);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-text-main/40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 w-full z-50 transform transition-transform duration-300">
        <div className="bg-white w-full rounded-t-3xl shadow-soft flex flex-col pt-3 pb-8 px-6 max-h-[85vh] overflow-y-auto">
          {/* Drag Handle */}
          <div className="flex justify-center mb-6 w-full cursor-grab active:cursor-grabbing pb-2">
            <div className="h-1.5 w-12 rounded-full bg-gray-300" />
          </div>

          {/* Header */}
          <h2 className="text-xl font-bold text-text-main mb-6">Hóspedes</h2>

          {/* Stepper Rows */}
          <div className="flex flex-col gap-6 mb-8">
            {/* Adults Row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-base font-semibold text-text-main">
                  Adultos
                </span>
                <span className="text-sm text-text-muted mt-0.5">
                  13+ anos
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={adults <= 1}
                  onClick={() => setAdults((v) => Math.max(1, v - 1))}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="w-6 text-center text-lg font-semibold text-text-main tabular-nums">
                  {adults}
                </span>
                <button
                  type="button"
                  onClick={() => setAdults((v) => v + 1)}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all active:scale-95 touch-manipulation"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-surface" />

            {/* Children Row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-base font-semibold text-text-main">
                  Crianças
                </span>
                <span className="text-sm text-text-muted mt-0.5">
                  2-12 anos
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={children <= 0}
                  onClick={() => setChildren((v) => Math.max(0, v - 1))}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="w-6 text-center text-lg font-semibold text-text-main tabular-nums">
                  {children}
                </span>
                <button
                  type="button"
                  onClick={() => setChildren((v) => v + 1)}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all active:scale-95 touch-manipulation"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-auto pt-4">
            <button
              type="button"
              onClick={handleSave}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-base py-4 rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98]"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
