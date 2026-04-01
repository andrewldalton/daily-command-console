const shimmerStyle: React.CSSProperties = {
  background: "linear-gradient(110deg, #1e2433 45%, #2c3548 55%, #1e2433)",
  backgroundSize: "200% 100%",
  animation: "shimmer 2s infinite linear",
};

function Bone({
  width,
  height,
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{ ...shimmerStyle, width, height }}
    />
  );
}

export default function SkeletonDashboard() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="min-h-screen bg-[#0f1219] p-6">
        {/* Hero area */}
        <div className="mb-10">
          <Bone width="200px" height="32px" className="mb-3" />
          <Bone width="150px" height="16px" className="mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Bone key={i} height="140px" className="rounded-xl" />
            ))}
          </div>
        </div>

        {/* XP Bar area */}
        <div className="mb-4">
          <Bone height="48px" className="w-full rounded-lg" />
        </div>

        {/* Main grid (7/5 column split) */}
        <div className="grid grid-cols-12 gap-5">
          {/* Left side — 7 cols */}
          <div className="col-span-12 lg:col-span-7">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Bone height="120px" className="rounded-xl" />
              <Bone height="120px" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Bone height="120px" className="rounded-xl" />
              <Bone height="120px" className="rounded-xl" />
            </div>
          </div>

          {/* Right side — 5 cols */}
          <div className="col-span-12 lg:col-span-5 flex flex-col items-center gap-4">
            {/* Momentum ring placeholder */}
            <div
              className="rounded-full"
              style={{ ...shimmerStyle, width: "140px", height: "140px" }}
            />
            {/* Stat boxes */}
            <div className="grid grid-cols-2 gap-4 w-full">
              <Bone height="80px" className="rounded-xl" />
              <Bone height="80px" className="rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
