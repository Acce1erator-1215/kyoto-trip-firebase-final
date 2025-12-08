
import React, { useState } from 'react';
import { Icons } from './Icon';

interface FlightPassProps {
  originCode: string;
  originCity: string;
  destCode: string;
  destCity: string;
  flightNum: string;
  date: string;
  time: string;
  seat: string;
  isReturn?: boolean;
}

export const FlightPass: React.FC<FlightPassProps> = ({ 
  originCode, originCity, destCode, destCity, 
  flightNum, date, time, seat, 
  isReturn = false 
}) => {
  const [isFlying, setIsFlying] = useState(false);

  const handleFlightClick = () => {
    if(isFlying) return;
    setIsFlying(true);
    setTimeout(() => setIsFlying(false), 8000); // 8 seconds duration
  };

  return (
    <div 
      onClick={handleFlightClick}
      className={`bg-white rounded-3xl shadow-luxury border border-stone-100 overflow-hidden relative mb-6 transition-all duration-300 cursor-pointer select-none group 
      ${isFlying ? 'animate-card-bump' : 'hover:scale-[1.01] hover:shadow-2xl'}`}
    >
      <div className="absolute inset-0 bg-wafu-paper opacity-60 pointer-events-none mix-blend-multiply"></div>
      
      {/* Header Strip */}
      <div className={`h-1.5 w-full absolute top-0 ${isReturn ? 'bg-wafu-indigo' : 'bg-gold-leaf shadow-md'}`}></div>
      
      {/* Wind Streams for Speed Effect - BREEZE OVERLAY (Updated to Gold) */}
      {isFlying && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            <div className="absolute top-[30%] right-[-10%] w-64 h-0.5 bg-gradient-to-r from-transparent via-wafu-gold/60 to-transparent animate-wind-stream blur-[1px]" style={{animationDelay: '0s'}}></div>
            <div className="absolute top-[50%] right-[-20%] w-96 h-[2px] bg-gradient-to-r from-transparent via-wafu-gold/80 to-transparent animate-wind-stream" style={{animationDelay: '0.1s'}}></div>
            <div className="absolute top-[70%] right-[-15%] w-48 h-0.5 bg-gradient-to-r from-transparent via-wafu-gold/50 to-transparent animate-wind-stream" style={{animationDelay: '0.3s'}}></div>
        </div>
      )}

      {/* Passing Clouds */}
      {isFlying && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            <div className="absolute top-8 right-[-20%] text-white/50 animate-cloud-pass opacity-0" style={{animationDuration: '3s', animationDelay: '0s'}}>
                <Icons.Cloud className="w-16 h-16 blur-[1px]" />
            </div>
            <div className="absolute top-24 right-[-20%] text-white/30 animate-cloud-pass opacity-0" style={{animationDuration: '2s', animationDelay: '1.2s'}}>
                <Icons.Cloud className="w-10 h-10 blur-[2px]" />
            </div>
             <div className="absolute top-40 right-[-20%] text-white/20 animate-cloud-pass opacity-0" style={{animationDuration: '4s', animationDelay: '2.5s'}}>
                <Icons.Cloud className="w-20 h-20 blur-[3px]" />
            </div>
        </div>
      )}
      
      {/* Flowing Gold Floor (Ground Scroll) */}
      {isFlying && (
        <div className="absolute bottom-0 left-0 w-full h-12 opacity-30 pointer-events-none overflow-hidden z-0">
           {/* Uses a simple background pattern to simulate ground moving */}
           <div 
             className="w-[200%] h-full animate-floor-scroll"
             style={{
                background: `repeating-linear-gradient(90deg, transparent, transparent 20px, #BFA46F 20px, #BFA46F 22px)`
             }}
           ></div>
           <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        </div>
      )}
      
      {/* Shine Effect */}
      {isFlying && <div className="animate-shine-sweep"></div>}

      <div className="p-6 pt-10 relative z-10">
         {/* Route */}
         <div className="flex items-center justify-between mb-8">
           <div className="flex flex-col">
             <span className="text-4xl font-black font-serif text-wafu-indigo tracking-tighter drop-shadow-sm">{originCode}</span>
             <span className="text-[10px] text-stone-400 font-bold tracking-[0.2em] uppercase mt-1">{originCity}</span>
           </div>
           
           <div className="flex-1 px-4 flex flex-col items-center opacity-80 group-hover:opacity-100 transition-opacity">
             {/* Plane Icon with Cruise Animation */}
             <div className="relative z-10 w-8 h-8 flex items-center justify-center">
                 {/* Engine Trail */}
                 {isFlying && (
                    <div className="absolute right-[50%] top-1/2 -mt-1 w-24 h-2 bg-gradient-to-l from-wafu-gold/60 to-transparent blur-sm rounded-full transform translate-x-1 origin-right opacity-80"></div>
                 )}
                 {/* Engine Pulse Ring */}
                 {isFlying && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-wafu-gold/50 rounded-full animate-engine-pulse"></div>
                 )}

                 {/* The icon naturally points Top-Right. rotate-45 makes it point Right (Horizontal). */}
                 <div className={`text-wafu-gold transition-all duration-500 relative
                     ${isFlying ? 'animate-plane-cruise' : 'rotate-45'}
                 `}>
                    <Icons.Plane />
                    {/* Wing Sparkle */}
                    {isFlying && (
                      <div className="absolute top-0 right-0 w-1 h-1 bg-white rounded-full animate-sparkle-fade shadow-[0_0_4px_white]"></div>
                    )}
                 </div>
             </div>
             
             {/* Path Line */}
             <div className="w-full h-px bg-stone-200 relative mt-2">
               <div className="absolute right-0 top-1/2 -mt-[3px] w-1.5 h-1.5 bg-stone-300 rounded-full box-border border border-white"></div>
               <div className="absolute left-0 top-1/2 -mt-[3px] w-1.5 h-1.5 bg-wafu-indigo rounded-full box-border border border-white"></div>
             </div>
           </div>
           
           <div className="flex flex-col items-end">
             <span className="text-4xl font-black font-serif text-wafu-indigo tracking-tighter drop-shadow-sm">{destCode}</span>
             <span className="text-[10px] text-stone-400 font-bold tracking-[0.2em] uppercase mt-1">{destCity}</span>
           </div>
         </div>

         {/* Details Grid */}
         <div className="grid grid-cols-2 gap-y-7 gap-x-4">
           <div>
             <p className="text-[9px] text-stone-400 uppercase font-bold tracking-widest mb-1.5">Flight</p>
             <p className="text-xl font-bold text-wafu-indigo font-serif tracking-wide">{flightNum}</p>
           </div>
           <div className="text-right">
              <p className="text-[9px] text-stone-400 uppercase font-bold tracking-widest mb-1.5">Seat</p>
              <p className="text-xl font-bold text-wafu-indigo font-serif tracking-wide">{seat}</p>
           </div>
           <div>
              <p className="text-[9px] text-stone-400 uppercase font-bold tracking-widest mb-1.5">Date</p>
              <p className="text-base font-bold text-wafu-text font-serif tracking-wide">{date}</p>
           </div>
           <div className="text-right">
              <p className="text-[9px] text-stone-400 uppercase font-bold tracking-widest mb-1.5">Time</p>
              <p className="text-base font-bold text-wafu-text font-serif tracking-wide">{time}</p>
           </div>
         </div>
      </div>

      {/* Footer / Cutoff - Refined with shadows */}
      <div className="bg-stone-50/80 backdrop-blur-sm px-6 py-5 border-t border-dashed border-stone-300 flex justify-between items-center relative z-10">
        <div className="w-5 h-5 bg-wafu-bg rounded-full absolute -top-3 -left-3 border border-stone-200 shadow-inner"></div>
        <div className="w-5 h-5 bg-wafu-bg rounded-full absolute -top-3 -right-3 border border-stone-200 shadow-inner"></div>
        
        <div className="flex flex-col">
           <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Class</span>
           <span className="text-sm font-bold text-wafu-text font-serif">Economy</span>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Airline</span>
           <span className="text-sm font-bold text-wafu-text font-serif">Starlux</span>
        </div>
      </div>
    </div>
  );
};
