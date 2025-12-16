
import React from 'react';
import { FlightPass } from '../FlightPass';

export const FlightTab: React.FC = () => {
  return (
    <div className="pt-8 px-6 min-h-screen bg-seigaiha bg-fixed pb-32">
      <div className="max-w-3xl mx-auto w-full">
        <div className="mb-8 border-b border-wafu-indigo/10 pb-4">
          <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-tight mb-2 drop-shadow-sm">機票資訊</h2>
          <p className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
            <span>Booking Ref:</span>
            <span className="text-wafu-gold font-mono">FO7V9A</span>
          </p>
        </div>

        <h3 className="text-lg font-bold text-wafu-indigo mb-4 ml-2 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-gold-leaf shadow-[0_0_8px_rgba(191,164,111,0.6)]"></div>
          <span className="tracking-widest">去程 (Outbound)</span>
        </h3>
        <FlightPass originCode="TPE" originCity="Taipei" destCode="UKB" destCity="Kobe" flightNum="JX 834" date="01/17 (Sat)" time="07:00 - 10:30" seat="12A, 12B" />

        <h3 className="text-lg font-bold text-wafu-indigo mb-4 ml-2 flex items-center gap-3 mt-10">
          <div className="w-1.5 h-1.5 rounded-full bg-wafu-indigo shadow-[0_0_8px_rgba(24,54,84,0.6)]"></div>
          <span className="tracking-widest">回程 (Inbound)</span>
        </h3>
        <FlightPass originCode="KIX" originCity="Osaka" destCode="TPE" destCity="Taipei" flightNum="JX 823" date="01/24 (Sat)" time="14:00 - 16:15" seat="12A, 12B" isReturn={true} />
      </div>
    </div>
  );
};
