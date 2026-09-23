import { useState } from 'react'
import { ImageOff } from 'lucide-react'

// ---------------------------------------------------------------
// Built-in educational SVG diagrams. Questions reference these via
// a diagram://<key> image_url so an image always renders even when
// offline, and nothing ever breaks the quiz layout.
// ---------------------------------------------------------------

const PALETTE = {
  blue: '#0ea5e9',
  green: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#64748b',
  violet: '#8b5cf6',
  sky: '#e0f2fe',
  mint: '#d1fae5',
  sand: '#fef3c7',
  blush: '#ffe4e6',
  ink: '#334155',
  light: '#f8fafc',
}

const S = ({ size = 12, weight = 500, color = PALETTE.ink }) => ({
  fontSize: size,
  fontWeight: weight,
  fill: color,
  fontFamily: 'Segoe UI, system-ui, sans-serif',
})

function DiagramDNA({ className }) {
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="DNA double helix diagram" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill={PALETTE.sky} />
      {[0, 1].map((k) => {
        const offset = k * 22
        return (
          <path
            key={k}
            d={`M ${90 + offset} 30 C 160 60, 160 40, ${90 + offset} 105 C 200 140, 200 180, 180 195 L ${90 + offset} 195`}
            fill="none"
            stroke={PALETTE.blue}
            strokeWidth="6"
            strokeLinecap="round"
          />
        )
      })}
      {[50, 85, 120, 155].map((y) => (
        <line key={y} x1="95" y1={y} x2="205" y2={130 + (y - 50)} stroke={PALETTE.green} strokeWidth="4" />
      ))}
      {[60, 95, 130, 165].map((y) => (
        <line key={y} x1="95" y1={y + 40} x2="205" y2={y} stroke={PALETTE.amber} strokeWidth="4" />
      ))}
      {[105, 140, 175, 210, 80].map((a) => (
        <circle key={a} cx="200" cy={a - 30} r="5" fill={PALETTE.rose} />
      ))}
      <text x="200" y="210" textAnchor="middle" {...S({ size: 13 })}>
        DNA — the molecule shared by all life
      </text>
    </svg>
  )
}

function DiagramFossil({ className }) {
  const layers = [
    { y: 30, c: PALETTE.sand },
    { y: 66, c: '#fde9c8' },
    { y: 102, c: '#f0dcc0' },
    { y: 138, c: '#e6cfa8' },
    { y: 174, c: '#d9bd92' },
  ]
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Fossil layers in sedimentary rock" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill={PALETTE.sky} />
      {layers.map((l, i) => (
        <g key={i}>
          <rect x="30" y={l.y} width="340" height="32" rx="8" fill={l.c} stroke="#d6c6a4" />
          {i === 0 && (
            <g>
              <ellipse cx="150" cy={l.y + 18} rx="34" ry="11" fill={PALETTE.slate} opacity="0.85" />
              <path d="M 118 14 l 26 12 l -6 6 z" fill={PALETTE.ink} opacity="0.7" />
              <circle cx="228" cy={l.y + 16} r="10" fill={PALETTE.slate} opacity="0.8" />
              <circle cx="248" cy={l.y + 18} r="7" fill={PALETTE.slate} opacity="0.7" />
            </g>
          )}
          {i === 2 && (
            <path d="M 120 128 c 18 -6 42 -4 54 4 c -16 4 -38 2 -54 -4 z m 40 -2 c 8 -4 22 -3 28 1 c -10 2 -24 1 -28 -1 z" fill={PALETTE.violet} opacity="0.9" />
          )}
          {i === 3 && (
            <path d="M 90 160 c 24 0 52 4 62 12 c -10 6 -38 8 -62 8 c -10 0 -16 -2 -20 -6 c 4 -8 10 -14 20 -14 z" fill={PALETTE.green} opacity="0.8" />
          )}
          <text x="46" y={l.y + 21} {...S({ size: 10, color: '#8a6d3b' })}>
            Layer {i + 1}
          </text>
        </g>
      ))}
      <text x="200" y="212" textAnchor="middle" {...S({ size: 12 })}>
        Fossils preserved in sedimentary rock layers
      </text>
    </svg>
  )
}

function DiagramHomologous({ className }) {
  const limb = (x, label) => (
    <g transform={`translate(${x} 130)`}>
      <path d="M 0 0 L 22 -18 L 46 -34 L 64 -52" fill="none" stroke={PALETTE.blue} strokeWidth="6" strokeLinecap="round" />
      <path d="M 46 -34 L 52 -10 L 84 -24 Z" fill={PALETTE.blue} opacity="0.55" stroke={PALETTE.blue} strokeWidth="3" />
      <path d="M 55 -44 L 74 -70" fill="none" stroke={PALETTE.blue} strokeWidth="5" strokeLinecap="round" />
      <path d="M 64 -52 L 92 -70" fill="none" stroke={PALETTE.blue} strokeWidth="5" strokeLinecap="round" />
      <text x="30" y="24" textAnchor="middle" {...S({ size: 12 })}>
        {label}
      </text>
      <text x="30" y="42" textAnchor="middle" {...S({ size: 9, color: PALETTE.slate })}>
        same bones, different jobs
      </text>
    </g>
  )
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Homologous forelimbs of human, whale and bird" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill={PALETTE.mint} />
      {limb(60, 'HUMAN ARM')}
      {limb(170, 'WHALE FLIPPER')}
      {limb(280, 'BIRD WING')}
      <text x="200" y="18" textAnchor="middle" {...S({ size: 13 })}>
        Homologous structures — same evolutionary origin
      </text>
      <rect x="120" y="86" width="24" height="24" rx="6" fill={PALETTE.green} opacity="0.8" />
      <rect x="230" y="86" width="24" height="24" rx="6" fill={PALETTE.green} opacity="0.8" />
      <rect x="340" y="86" width="24" height="24" rx="6" fill={PALETTE.green} opacity="0.8" />
    </svg>
  )
}

function DiagramAnalogous({ className }) {
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Analogous structures bird wing and insect wing" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill={PALETTE.sand} />
      {/* bird wing */}
      <g transform="translate(70 120) rotate(-8)">
        <path d="M 0 0 C -30 -30 -70 -46 -120 -42" stroke={PALETTE.blue} strokeWidth="5" fill="none" strokeLinecap="round" />
        {Array.from({ length: 7 }).map((_, i) => (
          <path key={i} d={`M ${-20 - i * 14} ${6 + i * 5} l ${-18 - i * 4} ${-30 - i * 3} M ${-20 - i * 14} ${6 + i * 5} l ${-30 - i * 5} ${-4 - i * 2}`} stroke={PALETTE.violet} strokeWidth="2.5" fill="none" />
        ))}
      </g>
      {/* insect wing */}
      <g transform="translate(300 120)">
        <ellipse cx="-40" cy="-20" rx="70" ry="34" fill={PALETTE.sky} stroke={PALETTE.blue} strokeWidth="4" transform="rotate(-20 -40 -20)" />
        <path d="M -100 -30 l 30 26 l 26 -8 z" fill={PALETTE.rose} opacity="0.9" />
      </g>
      <text x="95" y="200" textAnchor="middle" {...S({ size: 12 })}>BIRD WING (feathers)</text>
      <text x="310" y="200" textAnchor="middle" {...S({ size: 12 })}>INSECT WING (membrane)</text>
      <text x="200" y="24" textAnchor="middle" {...S({ size: 13 })}>
        Analogous structures — similar function, different origin
      </text>
    </svg>
  )
}

function DiagramVestigial({ className }) {
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Vestigial structures human appendix and whale pelvis" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill={PALETTE.blush} />
      {/* human */}
      <g transform="translate(100 40) scale(1)">
        <path d="M 0 60 c -18 -6 -22 -34 0 -52 c 22 18 18 46 0 52 z" fill={PALETTE.violet} opacity="0.35" />
        <circle cx="0" cy="18" r="9" fill={PALETTE.violet} opacity="0.4" />
        <circle cx="10" cy="54" r="6" fill={PALETTE.rose} />
        <text x="-14" y="36" {...S({ size: 10, color: PALETTE.rose })}>appendix</text>
      </g>
      {/* whale */}
      <g transform="translate(240 60)">
        <path d="M 0 40 C 40 -10 90 -10 120 30 C 96 52 52 54 0 40 z" fill={PALETTE.blue} opacity="0.5" />
        <path d="M 30 48 L 34 20 m 2 0 l 14 -18 m 4 18 l 16 -14 m 4 14 l 12 -22" stroke={PALETTE.ink} strokeWidth="4" fill="none" strokeLinecap="round" />
        <text x="52" y="72" textAnchor="middle" {...S({ size: 10, color: PALETTE.ink })}>tiny pelvis bones</text>
      </g>
      <text x="30" y="204" {...S({ size: 12 })}>HUMAN</text>
      <text x="238" y="204" {...S({ size: 12 })}>WHALE</text>
      <text x="200" y="16" textAnchor="middle" {...S({ size: 13 })}>
        Vestigial structures — leftovers with reduced function
      </text>
    </svg>
  )
}

function DiagramTree({ className }) {
  const tip = (x, label) => (
    <g>
      <circle cx={x} cy="40" r="6" fill={PALETTE.green} />
      <text x={x} y="26" textAnchor="middle" {...S({ size: 12 })}>{label}</text>
    </g>
  )
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Phylogenetic tree example" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill={PALETTE.sky} />
      {tip(60, 'A')}
      {tip(150, 'B')}
      {tip(250, 'C')}
      {tip(340, 'D')}
      <path d="M 60 40 L 60 90 Q 105 115 150 90 L 150 40" fill="none" stroke={PALETTE.blue} strokeWidth="4" />
      <path d="M 250 40 L 250 90 Q 295 115 340 90 L 340 40" fill="none" stroke={PALETTE.blue} strokeWidth="4" />
      <path d="M 105 107 L 105 130 Q 200 165 295 130 L 295 107" fill="none" stroke={PALETTE.green} strokeWidth="4" />
      <path d="M 105 130 L 105 168 L 295 168" fill="none" stroke={PALETTE.amber} strokeWidth="4" />
      <circle cx="105" cy="107" r="7" fill={PALETTE.rose} />
      <circle cx="295" cy="107" r="7" fill={PALETTE.rose} />
      <circle cx="200" cy="150" r="7" fill={PALETTE.violet} />
      <text x="112" y="96" {...S({ size: 10, color: PALETTE.rose })}>common ancestor</text>
      <text x="80" y="178" {...S({ size: 11 })}>root (most ancient)</text>
      <text x="200" y="214" textAnchor="middle" {...S({ size: 12 })}>
        Phylogenetic tree — branch points = common ancestors
      </text>
    </svg>
  )
}

function DiagramCladogram({ className }) {
  const item = (x, y, label) => (
    <g>
      <circle cx={x} cy={y} r="6" fill={PALETTE.green} />
      <text x={x} y={y + 22} textAnchor="middle" {...S({ size: 12 })}>{label}</text>
    </g>
  )
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Cladogram with shared derived characters" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill={PALETTE.mint} />
      {item(50, 60, 'Frog')}
      {item(170, 40, 'Lizard')}
      {item(260, 130, 'Mouse')}
      {item(350, 70, 'Chimp')}
      <path d="M 50 60 L 50 100 Q 50 120 70 120 L 150 120 L 150 40 L 170 40" fill="none" stroke={PALETTE.blue} strokeWidth="4" />
      <path d="M 150 120 L 120 120 L 120 90 L 100 90 M 100 90 L 100 70 L 100 90" fill="none" stroke={PALETTE.green} strokeWidth="4" />
      <path d="M 120 120 L 260 120 L 260 130 L 260 130" fill="none" stroke={PALETTE.blue} strokeWidth="4" />
      <path d="M 120 120 L 100 120 L 100 120 M 100 120 L 100 120" fill="none" stroke={PALETTE.amber} strokeWidth="4" />
      <line x1="135" y1="115" x2="135" y2="95" stroke={PALETTE.rose} strokeWidth="3" />
      <text x="140" y="100" {...S({ size: 10, color: PALETTE.rose })}>4 limbs</text>
      <line x1="120" y1="132" x2="120" y2="112" stroke={PALETTE.amber} strokeWidth="3" />
      <text x="92" y="130" {...S({ size: 10, color: PALETTE.amber })}>hair/milk</text>
      <line x1="128" y1="138" x2="128" y2="120" stroke={PALETTE.violet} strokeWidth="3" />
      <text x="228" y="128" {...S({ size: 10, color: PALETTE.violet })}>opposable thumbs</text>
      <text x="200" y="205" textAnchor="middle" {...S({ size: 12 })}>
        Cladogram — shared derived characters group related taxa
      </text>
    </svg>
  )
}

function DiagramBeaks({ className }) {
  const beak = (x, food, w, h) => (
    <g transform={`translate(${x} 120)`}>
      <circle cx="0" cy="-12" r="12" fill={PALETTE.slate} />
      <path d={`M 8 -16 l ${w} ${h * 0.4} l ${-w * 0.3} ${h * 0.5} q ${-w * 0.7} ${-h * 0.3} ${-w * 0.9} ${-h * 0.5} z`} fill={PALETTE.amber} stroke={PALETTE.ink} strokeWidth="2" />
      <path d={`M 8 -14 l ${w} ${h * 0.2}`} stroke={PALETTE.ink} strokeWidth="1.6" fill="none" />
      <text x="0" y="26" textAnchor="middle" {...S({ size: 10 })}>{food}</text>
    </g>
  )
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Different finch beak shapes adapted to foods" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill={PALETTE.sky} />
      {beak(60, 'seeds', 16, 8)}
      {beak(150, 'insects', 12, 14)}
      {beak(240, 'nectar', 30, 4)}
      {beak(330, 'fruit', 10, 10)}
      <text x="45" y="70" {...S({ size: 10, color: PALETTE.slate })}>seed-cracker</text>
      <text x="132" y="70" {...S({ size: 10, color: PALETTE.slate })}>insect probe</text>
      <text x="218" y="70" {...S({ size: 10, color: PALETTE.slate })}>nectar sip</text>
      <text x="310" y="70" {...S({ size: 10, color: PALETTE.slate })}>fruit crush</text>
      <text x="200" y="205" textAnchor="middle" {...S({ size: 12 })}>
        Darwin's finches — beaks adapted to food sources
      </text>
    </svg>
  )
}

function DiagramNaturalSelection({ className }) {
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Natural selection of beetles on a tree trunk" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill={PALETTE.sand} />
      <rect x="24" y="30" width="160" height="150" rx="12" fill="#b98a4e" stroke="#8a6d3b" />
      <rect x="216" y="30" width="160" height="150" rx="12" fill="#b98a4e" stroke="#8a6d3b" />
      {[
        [40, 50, PALETTE.green], [70, 60, '#3f5f2b'], [110, 70, PALETTE.green], [150, 90, '#3f5f2b'],
        [60, 110, '#2d4a22'], [130, 130, PALETTE.green], [90, 160, '#3f5f2b'], [160, 150, '#2d4a22'],
      ].map(([x, y, c], i) => (
        <ellipse key={`a${i}`} cx={x} cy={y} rx="8" ry="5" fill={c} />
      ))}
      {[
        [230, 50, '#2d4a22'], [270, 80, '#2d4a22'], [320, 60, '#3f5f2b'], [360, 90, '#23261f'],
        [250, 120, '#3f5f2b'], [300, 140, '#2d4a22'], [340, 150, '#23261f'], [260, 165, '#23261f'],
      ].map(([x, y, c], i) => (
        <ellipse key={`b${i}`} cx={x} cy={y} rx="8" ry="5" fill={c} />
      ))}
      <text x="104" y="200" textAnchor="middle" {...S({ size: 11 })}>Before</text>
      <text x="296" y="200" textAnchor="middle" {...S({ size: 11 })}>Predation favors camouflage</text>
    </svg>
  )
}

function DiagramCamo({ className }) {
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Camouflaged moth on a leaf" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill={PALETTE.sky} />
      <ellipse cx="200" cy="120" rx="150" ry="70" fill={PALETTE.green} opacity="0.8" />
      <path d="M 60 200 Q 200 40 340 200" fill="none" stroke="#0b7a5c" strokeWidth="14" />
      <path d="M 120 200 Q 200 80 300 200" fill="none" stroke="#0b7a5c" strokeWidth="10" />
      <g transform="translate(200 128)">
        <path d="M -18 0 Q -6 -22 18 -14 Q 10 8 -18 0 z" fill="#0f766e" stroke="#134e4a" strokeWidth="2" />
        <circle cx="8" cy="-8" r="2.4" fill="#134e4a" />
      </g>
      <text x="200" y="212" textAnchor="middle" {...S({ size: 12 })}>
        Camouflage — blending in is an adaptation
      </text>
    </svg>
  )
}

function DiagramMimicry({ className }) {
  const snake = (x, bands) => (
    <g transform={`translate(${x} 110)`}>
      <path d="M 0 0 Q 30 -14 70 -6 Q 110 2 150 -8" fill={`${bands ? PALETTE.rose : PALETTE.amber}`} stroke={PALETTE.ink} strokeWidth="3" />
      <path d="M 0 0 Q 30 14 70 6 Q 110 -2 150 8" fill={`${bands ? PALETTE.rose : PALETTE.amber}`} stroke={PALETTE.ink} strokeWidth="3" />
      <path d="M 0 0 q 6 -5 12 -10" stroke={PALETTE.ink} strokeWidth="3" fill="none" />
      {[20, 42, 64, 86, 108, 130].map((x2) => (
        <line key={x2} x1={x2} y1="-13" x2={x2 - 4} y2="13" stroke={PALETTE.ink} strokeWidth="4" />
      ))}
      <circle cx="-2" cy="-4" r="3" fill="#fff" />
    </g>
  )
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Mimicry: harmless king snake resembles venomous coral snake" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill={PALETTE.blush} />
      {snake(70, true)}
      {snake(235, false)}
      <rect x="90" y="36" width="26" height="14" rx="4" fill={PALETTE.rose} />
      <text x="96" y="40" {...S({ size: 11, color: '#fff' })}>VENOM</text>
      <text x="66" y="196" textAnchor="middle" {...S({ size: 11 })}>CORAL SNAKE (venomous)</text>
      <text x="230" y="196" textAnchor="middle" {...S({ size: 11 })}>KING SNAKE (harmless mimic)</text>
      <text x="200" y="20" textAnchor="middle" {...S({ size: 12 })}>
        Mimicry — copying a dangerous species for protection
      </text>
    </svg>
  )
}

function DiagramEmbryo({ className }) {
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Early vertebrate embryos look similar" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill={PALETTE.mint} />
      {['FISH', 'CHICK', 'HUMAN'].map((label, i) => (
        <g key={label} transform={`translate(${80 + i * 120} 130) scale(1.15)`}>
          <path d="M 0 -26 C 16 -30 26 -18 22 0 C 18 14 8 24 0 26 C -8 24 -18 14 -22 0 C -26 -18 -16 -30 0 -26 z" fill={PALETTE.blue} opacity="0.7" />
          <circle cx="0" cy="-6" r="3.5" fill={PALETTE.ink} />
          <path d="M -6 2 q 6 6 12 0 M -4 8 q 4 6 8 0 M -2 14 q 2 6 4 0" stroke={PALETTE.ink} strokeWidth="1.4" fill="none" />
          <path d="M 8 -18 q 10 -2 14 4" stroke={PALETTE.ink} strokeWidth="1.4" fill="none" />
          <text x="0" y="52" textAnchor="middle" {...S({ size: 11 })}>{label}</text>
        </g>
      ))}
      <text x="200" y="24" textAnchor="middle" {...S({ size: 13 })}>
        Early embryos of vertebrates look surprisingly alike
      </text>
      <text x="200" y="205" textAnchor="middle" {...S({ size: 12 })}>
        A reminder of shared developmental origin
      </text>
    </svg>
  )
}

function DiagramArchaeopteryx({ className }) {
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Archaeopteryx transitional fossil features" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill={PALETTE.sky} />
      <g transform="translate(120 120) rotate(2)">
        <path d="M 0 0 C 40 -30 80 -44 130 -42 C 90 -20 60 -4 10 20 Z" fill="#eab308" stroke="#a16207" strokeWidth="3" />
        <path d="M 30 -26 C 20 -10 6 10 -2 20" stroke={PALETTE.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="84" cy="-34" r="7" fill={PALETTE.ink} />
        <circle cx="96" cy="-38" r="7" fill={PALETTE.ink} />
        <path d="M 128 -44 L 124 -58 M 128 -42 L 116 -56 M 128 -40 L 108 -50" stroke={PALETTE.ink} strokeWidth="3" />
        <path d="M -12 16 C 6 32 30 40 62 42" stroke={PALETTE.ink} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 32 40 C 40 56 54 70 70 78" stroke={PALETTE.ink} strokeWidth="3" fill="none" />
        <path d="M 34 38 l 6 42 M 44 36 l 4 40 M 54 36 l 2 36" stroke="#a16207" strokeWidth="2" />
      </g>
      <text x="200" y="200" textAnchor="middle" {...S({ size: 12 })}>
        Archaeopteryx — teeth + reptile tail + bird feathers
      </text>
      <text x="200" y="28" textAnchor="middle" {...S({ size: 13 })}>
        A famous transitional fossil
      </text>
    </svg>
  )
}

function DiagramGalapagos({ className }) {
  const isle = (x, y) => (
    <g>
      <path d={`M ${x - 30} ${y} q 10 -26 30 -26 q 20 0 30 26 z`} fill={PALETTE.green} />
    </g>
  )
  const finch = (x, y, beak) => (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="0" r="8" fill={PALETTE.slate} />
      <path d={`M 6 -3 l ${beak} 3 l -3 4 z`} fill={PALETTE.amber} stroke={PALETTE.ink} strokeWidth="1.5" />
      <path d="M -4 6 q 4 4 8 4" stroke={PALETTE.slate} strokeWidth="2" fill="none" />
    </g>
  )
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Galapagos islands with finches" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill="#0ea5e9" />
      {isle(70, 90)}
      {isle(190, 60)}
      {isle(300, 100)}
      <path d="M 60 196 q 120 -26 240 -8" stroke="#075985" strokeWidth="3" fill="none" opacity="0.6" />
      {finch(95, 150, 8)}
      {finch(170, 170, 4)}
      {finch(215, 140, 12)}
      {finch(315, 165, 6)}
      <text x="200" y="215" textAnchor="middle" {...S({ size: 12 })}>
        Galapagos — isolated islands, varied habitats, varied finches
      </text>
    </svg>
  )
}

function DiagramPeppered({ className }) {
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Peppered moths on light and dark bark" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="400" height="220" rx="16" fill={PALETTE.sky} />
      <rect x="26" y="40" width="160" height="140" rx="12" fill="#e5d5b5" stroke="#b8a88a" />
      <rect x="214" y="40" width="160" height="140" rx="12" fill="#3a3a3a" stroke="#202020" />
      <g transform="translate(70 90) scale(0.9)">
        <path d="M -16 0 q -2 -12 8 -16 q 12 -4 18 4 q -2 12 -12 16 z" fill="#d9d9d9" stroke="#6b6b6b" />
        <circle cx="4" cy="-6" r="2" fill="#222" />
      </g>
      <g transform="translate(150 120) scale(0.9)">
        <path d="M -16 0 q -2 -12 8 -16 q 12 -4 18 4 q -2 12 -12 16 z" fill="#222" stroke="#444" />
        <circle cx="4" cy="-6" r="2" fill="#999" />
      </g>
      <g transform="translate(268 100) scale(0.9)">
        <path d="M -16 0 q -2 -12 8 -16 q 12 -4 18 4 q -2 12 -12 16 z" fill="#d9d9d9" stroke="#6b6b6b" />
        <circle cx="4" cy="-6" r="2" fill="#222" />
      </g>
      <g transform="translate(330 130) scale(0.9)">
        <path d="M -16 0 q -2 -12 8 -16 q 12 -4 18 4 q -2 12 -12 16 z" fill="#222" stroke="#444" />
        <circle cx="4" cy="-6" r="2" fill="#999" />
      </g>
      <text x="106" y="200" textAnchor="middle" {...S({ size: 11 })}>Light bark</text>
      <text x="294" y="200" textAnchor="middle" {...S({ size: 11 })}>Soot-darkened bark</text>
      <text x="200" y="22" textAnchor="middle" {...S({ size: 12 })}>
        Peppered moths — camouflage changes with pollution
      </text>
    </svg>
  )
}

const DIAGRAMS = {
  dna: DiagramDNA,
  fossil: DiagramFossil,
  homologous: DiagramHomologous,
  analogous: DiagramAnalogous,
  vestigial: DiagramVestigial,
  tree: DiagramTree,
  cladogram: DiagramCladogram,
  beaks: DiagramBeaks,
  'natural-selection': DiagramNaturalSelection,
  camo: DiagramCamo,
  mimicry: DiagramMimicry,
  embryo: DiagramEmbryo,
  archaeopteryx: DiagramArchaeopteryx,
  galapagos: DiagramGalapagos,
  peppered: DiagramPeppered,
}

function DiagramFallback({ label }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">
      <div className="text-center text-slate-400">
        <ImageOff className="mx-auto h-10 w-10" />
        <p className="mt-2 text-sm font-medium">Image unavailable</p>
        {label && <p className="text-xs opacity-70">{label}</p>}
      </div>
    </div>
  )
}

/**
 * Rendering component for question images.
 *  - diagram://<key>  -> built-in SVG educational diagram (always renders)
 *  - http(s)://...    -> remote image with graceful fallback
 */
export default function QuizImage({ imageUrl, alt = 'Educational diagram', className }) {
  const [failed, setFailed] = useState(false)

  const normalizedUrl = typeof imageUrl === 'string' ? imageUrl.trim() : ''

  if (!normalizedUrl) {
    return null
  }

  if (normalizedUrl.startsWith('diagram://')) {
    const key = normalizedUrl.replace('diagram://', '')
    const Diagram = DIAGRAMS[key]
    if (Diagram) {
      return (
        <figure className={className}>
          <Diagram className="h-full w-full" />
          <figcaption className="sr-only">{alt}</figcaption>
        </figure>
      )
    }
    return <DiagramFallback label={`diagram ${key}`} />
  }

  if (!failed) {
    return (
      <figure className={className}>
        <img
          src={normalizedUrl}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full rounded-2xl border border-slate-200 object-cover"
        />
        <figcaption className="sr-only">{alt}</figcaption>
      </figure>
    )
  }

  return <DiagramFallback label={alt} />
}