const Loader = () => {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center z-[9999] bg-white/70">
      <div className="animate-pulse">
        <svg width="64px" height="48px">
          <polyline 
            points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" 
            fill="none"
            stroke="rgba(239, 68, 68, 0.2)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline 
            points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" 
            fill="none"
            stroke="rgb(239, 68, 68)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="48, 144"
            strokeDashoffset="192"
            style={{
              animation: 'dash 1.4s linear infinite',
            }}
          />
        </svg>
      </div>
      <style>{`
        @keyframes dash {
          72.5% {
            opacity: 0;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default Loader; 