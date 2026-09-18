import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Loading1 from './Loading1'
import Loading2 from './Loading2'
import './index.css'

const path = window.location.pathname;

const FloatingMenu = () => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end group" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex-col gap-2 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 mb-2 transition-all duration-300 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto flex">
        <p className="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-widest px-2">Previews</p>
        <a href="/loading-1" className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${path === '/loading-1' ? 'bg-[#FF5927] text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`}>
          Option 1 (Bottom Slide)
        </a>
        <a href="/loading-2" className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${path === '/loading-2' ? 'bg-[#FF5927] text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`}>
          Option 2 (Sticky Bar)
        </a>
      </div>
      
      <div className="w-12 h-12 bg-white rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.15)] flex items-center justify-center cursor-pointer border border-gray-100 hover:scale-105 transition-transform text-gray-700">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {path === '/loading-1' ? <Loading1 /> : path === '/loading-2' ? <Loading2 /> : <App />}
    <FloatingMenu />
  </React.StrictMode>,
)
