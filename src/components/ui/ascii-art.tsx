/**
 * ASCII Art Components - Large, bold visual elements
 * Inspired by editorial design - these create visual impact as central graphics
 */

interface AsciiArtProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Decorative heart connection pattern
export function HeartConnection({ className = '' }: AsciiArtProps) {
  return (
    <div className={`ascii-art text-center ${className}`}>
      {`        ✶         ✶
      ╱╲╲╱╲     ╱╲╲╱╲
     ╱╱  ╲╲   ╱╱  ╲╲
    ╱╱    ╲╲ ╱╱    ╲╲
    ╲╲    ╱╱ ╲╲    ╱╱
     ╲╲  ╱╱   ╲╲  ╱╱
      ╲╲╱╲     ╲╲╱╲
        ○───────○
      ╱╲╱╲     ╱╲╱╲
     ╱╱  ╲╲   ╱╱  ╲╲
    ✶      ╲ ╱      ✶`}
    </div>
  );
}

// Geometric connection pattern
export function GeometricPattern({ className = '' }: AsciiArtProps) {
  return (
    <div className={`ascii-art text-center ${className}`}>
      {`      ◇────────◇
     ╱  ⋆    ⋆  ╲
    ◇    ○○     ◇
     ╲  ⋆    ⋆  ╱
      ◇────────◇`}
    </div>
  );
}

// Abstract wave pattern for searching state
export function WavePattern({ className = '' }: AsciiArtProps) {
  return (
    <div className={`ascii-art text-center ${className}`}>
      {`     ≋≋≋≋≋≋≋≋≋
   ⋱          ⋰
 ⋰    ○   ○    ⋱
⋱  ○        ○   ⋰
 ⋲    ○   ○    ⋱
   ⋰          ⋱
     ≋≋≋≋≋≋≋≋≋`}
    </div>
  );
}

// Minimal connection dots for hero
export function ConnectionDots({ className = '' }: AsciiArtProps) {
  return (
    <div className={`ascii-art text-center ${className}`}>
      {`    ●───●───●
   ╱╲   │   ╱╲
  ●  ●──┼──●  ●
   ╲╱   │   ╲╱
    ●───●───●`}
    </div>
  );
}

// Single large decorative element
export function LargeHeart({ className = '' }: AsciiArtProps) {
  return (
    <div className={`ascii-art text-center ${className}`}>
      {`         ░░░░░░░░░░░░
      ░░▒▒▒▒▒▒▒▒▒▒▒▒░░
    ░▒▒██████████████▒▒░
   ▒▒██████████████████▒▒
  ▒██████████████████████▒
  ▒██████████████████████▒
   ▒▒██████████████████▒▒
    ░▒▒██████████████▒▒░
      ░░▒▒████████▒▒░░
         ░░██████░░
            ░░░░`}
    </div>
  );
}

// Corner decoration for cards
export function CornerDecoration({ className = '' }: AsciiArtProps) {
  return (
    <div className={`ascii-art ${className}`}>
      {`╭──✶
│  ╲
○   ○`}
    </div>
  );
}

// Pulsing circle animation (CSS-based, not a spinner)
export function PulsingCircle({ className = '' }: AsciiArtProps) {
  return (
    <div className={`ascii-art text-center ${className}`}>
      <div className="inline-block animate-pulse">
        {`     ╔═══════╗
   ╔══╝  ○   ╚══╗
  ║             ║
   ╚══╗     ╔══╝
     ╚═══════╝`}
      </div>
    </div>
  );
}

// Minimalist grid pattern
export function GridPattern({ className = '' }: AsciiArtProps) {
  return (
    <div className={`ascii-art text-center ${className}`}>
      {`  ╔═╦═╦═╦═╗
  ║○║ ║○║ ║
  ╠═╬═╬═╬═╣
  ║ ║○║ ║○║
  ╠═╬═╬═╬═╣
  ║○║ ║○║ ║
  ╚═╩═╩═╩═╝`}
    </div>
  );
}

// ============ LARGE-SCALE EDITORIAL ELEMENTS ============
// Inspired by the "Speakers wanted" reference image

// Large dot-matrix heart silhouette
export function DotMatrixHeart({ className = '', size = 'lg' }: AsciiArtProps) {
  const sizeClasses = {
    sm: 'text-[8px] leading-[10px] opacity-40',
    md: 'text-[10px] leading-[12px] opacity-50',
    lg: 'text-[12px] leading-[14px] opacity-60'
  };

  return (
    <div className={`ascii-art text-center select-none ${sizeClasses[size]} ${className}`}>
      {`         ░░░░░░░░░░░░░░░░
      ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
    ░▒▒██████▒▒▒▒▒▒██████▒▒░
   ▒▒██████████▒▒▒██████████▒▒
  ▒███████████████████████████▒
  ▒███████████████████████████▒
   ▒▒████████████████████████▒▒
    ░▒▒████████████████████▒▒░
      ░░▒▒██████████████▒▒░░
         ░░▒▒██████▒▒░░
            ░░████░░
              ░░░░`}
    </div>
  );
}

// Large dot-matrix figure of two people connecting
export function DotMatrixConnection({ className = '', size = 'lg' }: AsciiArtProps) {
  const sizeClasses = {
    sm: 'text-[8px] leading-[10px] opacity-40',
    md: 'text-[10px] leading-[12px] opacity-50',
    lg: 'text-[12px] leading-[14px] opacity-60'
  };

  return (
    <div className={`ascii-art text-center select-none ${sizeClasses[size]} ${className}`}>
      {`      ▓▓▓▓                      ▓▓▓▓
    ▓██████▓                  ▓██████▓
   ▓████████▓                ▓████████▓
    ▓██████▓   ⋰⋰⋰⋰⋰⋰⋰⋰   ▓██████▓
      ▓▓▓▓   ⋰            ⋰   ▓▓▓▓
            ⋰              ⋰
          ⋰      ████        ⋰
        ⋰      ████████       ⋰
      ⋰        ████████        ⋰
    ⋰           ██████           ⋰
  ⋰             ████             ⋰
  ⋰                               ⋰
    ⋰                           ⋰
      ⋰       ╭────────╮      ⋰
        ⋰     │  ○  ○  │    ⋰
          ⋰    ╲  ██  ╱   ⋰
            ⋰    ╲██╱   ⋰
               ⋰      ⋰
                  ⋰⋰⋰`}
    </div>
  );
}

// Large abstract wave/connection pattern
export function LargeWavePattern({ className = '', size = 'lg' }: AsciiArtProps) {
  const sizeClasses = {
    sm: 'text-[8px] leading-[10px] opacity-40',
    md: 'text-[10px] leading-[12px] opacity-50',
    lg: 'text-[12px] leading-[14px] opacity-60'
  };

  return (
    <div className={`ascii-art text-center select-none ${sizeClasses[size]} ${className}`}>
      {`      ≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋
    ⋰                         ⋱
  ⋰      ▓▓▓▓      ▓▓▓▓        ⋱
 ⋱     ▓██████▓  ▓██████▓       ⋰
⋰      ▓██████▓  ▓██████▓        ⋰
⋱        ▓▓▓▓      ▓▓▓▓         ⋰
 ⋲                               ⋱
  ⋰         ○        ○          ⋱
    ⋰                     ⋱
      ⋱                 ⋰
        ≋≋≋≋≋≋≋≋≋≋≋≋≋≋`}
    </div>
  );
}

// Minimal dot pattern for background
export function DotField({ className = '', size = 'md' }: AsciiArtProps) {
  const sizeClasses = {
    sm: 'text-[6px] leading-[8px] opacity-20',
    md: 'text-[8px] leading-[10px] opacity-25',
    lg: 'text-[10px] leading-[12px] opacity-30'
  };

  return (
    <div className={`ascii-art text-center select-none ${sizeClasses[size]} ${className}`}>
      {`·     ·   ·     ·   ·     ·   ·
   ·     ·   ·     ·   ·     ·
·     ·   ·     ·   ·     ·   ·
   ·     ·   ·     ·   ·     ·
·     ·   ·     ·   ·     ·   ·
   ·     ·   ·     ·   ·     ·`}
    </div>
  );
}

// Animated searching pattern (subtle pulse, not spinner)
export function SearchingPattern({ className = '' }: AsciiArtProps) {
  return (
    <div className={`ascii-art text-center select-none ${className}`}>
      <div className="inline-block">
        <div className="animate-pulse text-[12px] leading-[14px] opacity-50">
          {`      ▓▓▓▓▓▓▓▓▓▓
    ▓▓▓▓        ▓▓▓▓
  ▓▓▓▓            ▓▓▓▓
 ▓▓▓    ○      ○    ▓▓▓
▓▓▓   ○   ▓▓▓▓   ○   ▓▓▓
▓▓▓       ▓▓▓▓       ▓▓▓
 ▓▓▓    ○      ○    ▓▓▓
  ▓▓▓▓            ▓▓▓▓
    ▓▓▓▓        ▓▓▓▓
      ▓▓▓▓▓▓▓▓▓▓`}
        </div>
      </div>
    </div>
  );
}

// ============ ADDITIONAL EDITORIAL ELEMENTS ============

// Elegant user profile silhouette
export function ProfileSilhouette({ className = '', size = 'lg' }: AsciiArtProps) {
  const sizeClasses = {
    sm: 'text-[8px] leading-[10px] opacity-40',
    md: 'text-[10px] leading-[12px] opacity-50',
    lg: 'text-[12px] leading-[14px] opacity-60'
  };

  return (
    <div className={`ascii-art text-center select-none ${sizeClasses[size]} ${className}`}>
      {`        ░████████░
      ░████████████░
     ▒██████████████▒
     ▒██████████████▒
      ░████████████░
        ░████████░
           ░██░
        ░████████░
      ░████████████░
     ▒██████████████▒
    ▓██████  ██  ████▓
   ▓████░      ░████▓
  ▓████          ████▓`}
    </div>
  );
}

// Two profile silhouettes facing each other (for matches/connections)
export function DoubleSilhouette({ className = '', size = 'lg' }: AsciiArtProps) {
  const sizeClasses = {
    sm: 'text-[7px] leading-[9px] opacity-40',
    md: 'text-[9px] leading-[11px] opacity-50',
    lg: 'text-[11px] leading-[13px] opacity-60'
  };

  return (
    <div className={`ascii-art text-center select-none ${sizeClasses[size]} ${className}`}>
      {`  ▓███████▓        ▓███████▓
 ▓██████████▓    ▓██████████▓
▓████████████▓  ▓████████████▓
 ▓██████████▓    ▓██████████▓
  ▓███████▓        ▓███████▓
    ▓██▓            ▓██▓
   ▓████▓          ▓████▓
  ▓██████▓        ▓██████▓
  ▓██████▓        ▓██████▓
  ▓██▓  ▓██▓    ▓██▓  ▓██▓
 ▓██▓    ▓██▓  ▓██▓    ▓██▓`}
    </div>
  );
}

// Minimalist heart (cleaner than dot matrix version)
export function MinimalHeart({ className = '', size = 'md' }: AsciiArtProps) {
  const sizeClasses = {
    sm: 'text-[10px] leading-[12px] opacity-50',
    md: 'text-[14px] leading-[16px] opacity-60',
    lg: 'text-[18px] leading-[20px] opacity-70'
  };

  return (
    <div className={`ascii-art text-center select-none ${sizeClasses[size]} ${className}`}>
      {`   ♥♥♥♥♥   ♥♥♥♥♥
  ♥♥♥♥♥♥♥ ♥♥♥♥♥♥♥
 ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥
 ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥
  ♥♥♥♥♥♥♥♥♥♥♥♥♥♥
   ♥♥♥♥♥♥♥♥♥♥♥
     ♥♥♥♥♥♥♥
       ♥♥♥♥
         ♥`}
    </div>
  );
}

// Chat bubbles conversation
export function ChatBubbles({ className = '', size = 'md' }: AsciiArtProps) {
  const sizeClasses = {
    sm: 'text-[8px] leading-[10px] opacity-40',
    md: 'text-[10px] leading-[12px] opacity-50',
    lg: 'text-[12px] leading-[14px] opacity-60'
  };

  return (
    <div className={`ascii-art text-center select-none ${sizeClasses[size]} ${className}`}>
      {`     ╭──────────────╮
     │ ○  ○  ○  ○   │
     │              │
     ╰───────○──────╯
            ╱
           ╱   ╭──────────────╮
              │   ○  ○  ○    │
              │              │
              ╰───────○──────╯
                     ╲
                      ╲`}
    </div>
  );
}

// Bell icon (for notifications)
export function BellIcon({ className = '', size = 'md' }: AsciiArtProps) {
  const sizeClasses = {
    sm: 'text-[10px] leading-[12px] opacity-50',
    md: 'text-[14px] leading-[16px] opacity-60',
    lg: 'text-[18px] leading-[20px] opacity-70'
  };

  return (
    <div className={`ascii-art text-center select-none ${sizeClasses[size]} ${className}`}>
      {`       ▓▓
      ▓██▓
     ▓████▓
    ▓██████▓
   ▓████████▓
   ▓████████▓
   ▓████████▓
    ▓██████▓
     ▓████▓
    ╱      ╲
   ══════════`}
    </div>
  );
}

// Lock icon (for secure/privacy)
export function LockIcon({ className = '', size = 'md' }: AsciiArtProps) {
  const sizeClasses = {
    sm: 'text-[10px] leading-[12px] opacity-50',
    md: 'text-[14px] leading-[16px] opacity-60',
    lg: 'text-[18px] leading-[20px] opacity-70'
  };

  return (
    <div className={`ascii-art text-center select-none ${sizeClasses[size]} ${className}`}>
      {`     ▓██████▓
   ▓██      ██▓
  ▓██        ██▓
  ▓██        ██▓
  ▓████████████▓
  ▓████████████▓
  ▓██  ▓▓  ██▓
  ▓██  ▓▓  ██▓
  ▓████████████▓
  ▓████████████▓
    ▓████████▓`}
    </div>
  );
}

// Checkmark (for success/completion)
export function CheckmarkIcon({ className = '', size = 'md' }: AsciiArtProps) {
  const sizeClasses = {
    sm: 'text-[10px] leading-[12px] opacity-50',
    md: 'text-[14px] leading-[16px] opacity-60',
    lg: 'text-[18px] leading-[20px] opacity-70'
  };

  return (
    <div className={`ascii-art text-center select-none ${sizeClasses[size]} ${className}`}>
      {`                ▓▓
             ▓▓▓▓
          ▓▓▓▓▓▓
        ▓▓▓▓
  ▓▓  ▓▓▓▓
  ▓▓▓▓▓▓▓▓
   ▓▓▓▓▓
     ▓▓`}
    </div>
  );
}

// Decorative corner flourish
export function CornerFlourish({ className = '' }: AsciiArtProps) {
  return (
    <div className={`ascii-art select-none opacity-30 ${className}`}>
      {`╭─────✶
│    ╲
│     ○
○`}
    </div>
  );
}

// Empty state placeholder (for no content)
export function EmptyBox({ className = '', size = 'md' }: AsciiArtProps) {
  const sizeClasses = {
    sm: 'text-[8px] leading-[10px] opacity-40',
    md: 'text-[10px] leading-[12px] opacity-50',
    lg: 'text-[12px] leading-[14px] opacity-60'
  };

  return (
    <div className={`ascii-art text-center select-none ${sizeClasses[size]} ${className}`}>
      {`  ╔═════════════════════╗
  ║                     ║
  ║         ∅           ║
  ║                     ║
  ║                     ║
  ║                     ║
  ╚═════════════════════╝`}
    </div>
  );
}
