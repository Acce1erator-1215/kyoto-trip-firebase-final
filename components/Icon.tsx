
import React from 'react';

interface IconProps {
  className?: string;
  strokeWidth?: number;
  filled?: boolean;
}

export const Icons = {
  MapPin: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Calendar: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Wallet: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>,
  ShoppingBag: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>,
  Trash: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Edit: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Plus: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Check: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Navigation: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>,
  CloudSun: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="M20 12h2"></path><path d="m19.07 4.93-1.41 1.41"></path><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"></path><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"></path></svg>,
  QrCode: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Plane: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path></svg>,
  Ticket: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v2a3 3 0 1 1 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"></path></svg>,
  DragHandle: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>,
  
  // New Icons
  Utensils: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"></path></svg>,
  Star: ({ filled = false, className, strokeWidth = 2 }: IconProps) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
  MapLink: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>,
  Cloud: ({ className, strokeWidth = 2 }: IconProps) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17.5,19c-3.037,0-5.5-2.463-5.5-5.5c0-1.025,0.283-1.984,0.769-2.812C12.378,10.258,11.716,10,11,10c-3.866,0-7,3.134-7,7s3.134,7,7,7h7.5c2.485,0,4.5-2.015,4.5-4.5S20.985,15,18.5,15H17.5V19z M17.5,13c-1.381,0-2.5,1.119-2.5,2.5s1.119,2.5,2.5,2.5h1.0c1.381,0,2.5-1.119,2.5-2.5S19.881,13,18.5,13H17.5z M6,17c0-2.761,2.239-5,5-5c0.573,0,1.121,0.098,1.633,0.279C12.285,10.605,12,8.847,12,7c0-3.866,3.134-7,7-7s7,3.134,7,7c0,1.93-0.784,3.682-2.05,4.982C23.955,12.394,24,12.937,24,13.5c0,3.59-2.91,6.5-6.5,6.5H6z"></path></svg>,
  
  // Sakura (Cherry Blossom) Icon - Correct Orientation (Upright)
  Sakura: ({ className }: IconProps) => (
    <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-sm ${className || ''}`} fill="currentColor">
       <g transform="translate(50,50)">
          {[0, 72, 144, 216, 288].map((angle, i) => (
             <path 
                key={i} 
                d="M0,0 C-5,-10 -15,-20 -15,-32 C-15,-42 -8,-48 0,-40 C8,-48 15,-42 15,-32 C15,-20 5,-10 0,0" 
                transform={`rotate(${angle}) translate(0, -6)`}
             />
          ))}
          <circle cx="0" cy="0" r="3" fill="currentColor" fillOpacity="0.3" />
       </g>
    </svg>
  ),

  // Single Sakura Petal with texture/gradient feel
  SakuraPetal: ({ className }: IconProps) => (
    <svg viewBox="0 0 50 50" className={`w-full h-full ${className || ''}`} fill="currentColor">
        <path d="M25,50 C25,50 15,35 15,20 C15,10 20,2 25,10 C30,2 35,10 35,20 C35,35 25,50 25,50" fillOpacity="0.8" />
        <path d="M25,50 C25,50 18,35 18,22 C18,15 22,5 25,10" fill="white" fillOpacity="0.2" />
    </svg>
  )
};
