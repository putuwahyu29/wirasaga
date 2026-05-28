import React, { useState } from 'react';
import Sirens from './Sirens';
import CPRCompanion from './CPRCompanion';
import GoBagCalculator from './GoBagCalculator';
import SOSMorseSignal from './SOSMorseSignal';
import FirstAidGuides from './FirstAidGuides';
import DigitalMedicalID from './DigitalMedicalID';
import SurvivalCompass from './SurvivalCompass';

type ToolkitTab = 'alarm' | 'signaling' | 'guides' | 'medical';

export default function ToolkitView() {
  const [activeTab, setActiveTab] = useState<ToolkitTab>('alarm');

  const tabs = [
    { id: 'alarm', label: 'Suara & Logistik', icon: 'campaign' },
    { id: 'signaling', label: 'Sinyal & Kompas', icon: 'explore' },
    { id: 'guides', label: 'Protokol P3K', icon: 'emergency' },
    { id: 'medical', label: 'Kartu Medis', icon: 'contact_page' }
  ] as const;

  return (
    <div className="w-full flex flex-col gap-6 px-4 md:px-8 pt-6 pb-28 max-w-4xl mx-auto animate-fade-in scroll-smooth">
      
      {/* Title Header */}
      <div className="flex flex-col border-b border-outline-variant/30 pb-4 mb-2">
        <h2 className="text-3.5xl font-black text-neutral-900 dark:text-zinc-50 uppercase tracking-tight font-sans">
          SIAGA BENCANA
        </h2>
        <p className="text-sm text-neutral-600 dark:text-zinc-400 mt-1 font-semibold leading-relaxed">
          Kotak Alat Penyelamatan Mandiri & Mitigasi Darurat Nasional
        </p>
      </div>

      {/* Segmented Controller navigation tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-neutral-100 dark:bg-zinc-950 p-2 rounded-2xl border border-neutral-200/50 dark:border-zinc-900 shadow-sm">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ToolkitTab)}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl transition-all cursor-pointer font-bold select-none ${
                isActive
                  ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white shadow-md border border-neutral-200/50 dark:border-zinc-800'
                  : 'text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg sm:text-xl font-bold">
                {tab.icon}
              </span>
              <span className="text-xs sm:text-xs">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dynamic render of active toolkit view items */}
      <div className="flex flex-col gap-6 animate-fade-in">
        
        {/* Tab 1: Alarm, Sirene, Metronom CPR & Tas Siaga */}
        {activeTab === 'alarm' && (
          <div className="flex flex-col gap-6">
            {/* Sirens Card */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-primary/20 dark:border-zinc-800 rounded-[32px] p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="relative z-10 text-left">
                <h3 className="text-lg font-black text-primary dark:text-red-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined filled text-primary dark:text-red-500">campaign</span>
                  Sirine Darurat Lokal
                </h3>
                <p className="text-xs text-neutral-600 dark:text-zinc-450 mb-4 leading-relaxed font-normal">
                  Aktifkan alarm frekuensi ganda penarik perhatian apabila Anda terjebak dalam reruntuhan atau membutuhkan kepedulian visual/suara orang sekitar secara cepat.
                </p>
                <Sirens />
              </div>
            </div>

            {/* CPR & Go-Bag side-by-side or stacked grid depending on layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* CPR Companion Wrapper */}
              <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800 rounded-[32px] p-2 shadow-md hover:border-primary/20 transition-all duration-300">
                <CPRCompanion />
              </div>

              {/* Go Bag Calculator Wrapper */}
              <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800 rounded-[32px] p-2 shadow-md hover:border-primary/20 transition-all duration-300">
                <GoBagCalculator />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sandi Morse SOS & Survival Compass */}
        {activeTab === 'signaling' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* SOS Morse Signal Card */}
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800 rounded-[32px] p-2 shadow-md">
              <SOSMorseSignal />
            </div>

            {/* Survival Compass Card */}
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800 rounded-[32px] p-2 shadow-md">
              <SurvivalCompass />
            </div>
          </div>
        )}

        {/* Tab 3: Disaster First Aid Protocols & Guides */}
        {activeTab === 'guides' && (
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800 rounded-[32px] p-2 shadow-md">
            <FirstAidGuides />
          </div>
        )}

        {/* Tab 4: Local Digital Medical Profile CARD */}
        {activeTab === 'medical' && (
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800 rounded-[32px] p-2 shadow-md">
            <DigitalMedicalID />
          </div>
        )}

      </div>
    </div>
  );
}
