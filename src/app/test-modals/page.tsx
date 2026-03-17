"use client";

import { useState } from "react";
import GuestSelectionModal from "@/components/stitch/GuestSelectionModal";
import SearchDatesModal from "@/components/stitch/SearchDatesModal";
import MenuLanguageSheet from "@/components/stitch/MenuLanguageSheet";

export default function TestModalsPage() {
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [datesModalOpen, setDatesModalOpen] = useState(false);
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface p-12 flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-display font-bold mb-8">Testear Modales (Phase 2)</h1>
      
      <button 
        onClick={() => setGuestModalOpen(true)}
        className="bg-white border border-gray-200 px-8 py-4 rounded-xl shadow-sm hover:shadow-md hover:border-primary transition-all font-semibold w-72 text-left flex items-center justify-between"
      >
        <span>Selección de Huéspedes</span>
        <span className="material-symbols-outlined text-primary">group</span>
      </button>

      <button 
        onClick={() => setDatesModalOpen(true)}
        className="bg-white border border-gray-200 px-8 py-4 rounded-xl shadow-sm hover:shadow-md hover:border-primary transition-all font-semibold w-72 text-left flex items-center justify-between"
      >
        <span>Búsqueda de Fechas</span>
        <span className="material-symbols-outlined text-primary">calendar_month</span>
      </button>

      <button 
        onClick={() => setMenuSheetOpen(true)}
        className="bg-white border border-gray-200 px-8 py-4 rounded-xl shadow-sm hover:shadow-md hover:border-primary transition-all font-semibold w-72 text-left flex items-center justify-between"
      >
        <span>Menú / Idioma</span>
        <span className="material-symbols-outlined text-primary">menu</span>
      </button>

      <GuestSelectionModal 
        open={guestModalOpen} 
        onClose={() => setGuestModalOpen(false)} 
        onSave={(adults, children) => console.log("Saved guests:", { adults, children })}
      />
      
      <SearchDatesModal 
        open={datesModalOpen} 
        onClose={() => setDatesModalOpen(false)} 
      />
      
      <MenuLanguageSheet 
        open={menuSheetOpen} 
        onClose={() => setMenuSheetOpen(false)} 
      />
    </div>
  );
}
