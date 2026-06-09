import React from "react";

interface PhoneContainerProps {
  children: React.ReactNode;
}

export const PhoneContainer: React.FC<PhoneContainerProps> = ({ children }) => {
  return (
    <div id="phone-layout" className="min-h-screen bg-cream md:bg-stone-300 md:bg-radial from-stone-200 to-stone-400 flex items-center justify-center py-6 px-4">
      {/* Outer physical bezel (Only on MD screen widths and up) */}
      <div 
        id="phone-device-bezel"
        className="w-full max-w-[420px] h-[860px] bg-cream md:border-[10px] md:border-clay md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] md:rounded-[48px] overflow-hidden relative flex flex-col"
      >
        {/* Simulated iOS Status Bar notches */}
        <div className="hidden md:flex justify-between items-center px-8 pt-3 pb-2 text-clay text-[11.5px] font-medium bg-cream select-none z-30">
          <span>9:41</span>
          <div className="w-[100px] h-[18px] bg-clay rounded-full absolute left-1/2 -translate-x-1/2 top-2"></div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 fill-clay" viewBox="0 0 24 24">
              <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L14.35 6.43C13.62 6.13 12.83 3 12 3zm0 18c4.97 0 9-4.03 9-9 0-2.12-.74-4.07-1.97-5.61L10.35 18.23c.73.3 1.52 3.43 2.12 3.43z" />
            </svg>
            <span className="text-[10px]">5G</span>
            <div className="w-5 h-2.5 border border-clay rounded-xs p-[1px] flex">
              <div className="bg-clay w-full h-full rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* Dynamic viewport wrapper */}
        <div id="app-viewport" className="flex-1 overflow-y-auto relative flex flex-col">
          {children}
        </div>

        {/* Simulated bottom home indicator pill on iOS */}
        <div className="hidden md:block w-full bg-cream py-1.5 flex justify-center items-center z-30 select-none">
          <div className="w-32 h-1 bg-clay/30 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
