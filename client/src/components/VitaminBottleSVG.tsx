export function VitaminBottleSVG({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cap */}
      <rect x="55" y="18" width="50" height="24" rx="6" fill="hsl(152 55% 33% / 0.18)" />
      <rect x="60" y="22" width="40" height="16" rx="4" fill="hsl(152 55% 33% / 0.25)" />

      {/* Neck */}
      <rect x="62" y="40" width="36" height="14" rx="3" fill="hsl(152 55% 33% / 0.15)" />

      {/* Bottle body */}
      <path
        d="M48 58 C42 62 38 72 38 84 L38 158 C38 166 45 172 54 172 L106 172 C115 172 122 166 122 158 L122 84 C122 72 118 62 112 58 Z"
        fill="hsl(152 55% 33% / 0.08)"
        stroke="hsl(152 55% 33% / 0.25)"
        strokeWidth="1.5"
      />

      {/* Label area */}
      <rect x="46" y="80" width="68" height="72" rx="4" fill="hsl(152 55% 33% / 0.12)" />

      {/* Leaf icon on label */}
      <path
        d="M72 108 C72 108 74 100 80 96 C86 92 90 94 90 94 C90 94 88 102 82 106 C76 110 72 108 72 108Z"
        fill="hsl(152 55% 33% / 0.6)"
      />
      <path
        d="M72 108 C74 104 78 102 82 100"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Text lines on label */}
      <rect x="54" y="120" width="52" height="5" rx="2.5" fill="hsl(152 55% 33% / 0.3)" />
      <rect x="60" y="130" width="40" height="4" rx="2" fill="hsl(152 55% 33% / 0.2)" />
      <rect x="64" y="140" width="32" height="4" rx="2" fill="hsl(152 55% 33% / 0.15)" />

      {/* Shine */}
      <path
        d="M52 72 C50 78 49 88 49 98"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}
