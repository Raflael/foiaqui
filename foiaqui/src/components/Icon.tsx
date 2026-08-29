import type { ReactNode } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * Ícones traçados 24×24, os mesmos do protótipo.
 *
 * `stroke`, `fill` e `strokeWidth` são herdados do `<Svg>` pelos filhos,
 * então cada ícone abaixo só declara geometria.
 */
const glyphs = {
  search: (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="m21 21-4.3-4.3" />
    </>
  ),
  filter: <Path d="M4 6h16M7 12h10M10 18h4" />,
  camera: (
    <>
      <Path d="M4 8l2-3h4l1 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z" />
      <Circle cx={12} cy={13} r={3.4} />
    </>
  ),
  film: (
    <>
      <Path d="M4 8h16v11H4z" />
      <Path d="M4 8l3-4h10l3 4" />
    </>
  ),
  /** coreto — o pin da praça */
  bandstand: (
    <>
      <Path d="M12 3v18" />
      <Path d="M5 8h14" />
      <Path d="M7 8a5 5 0 0 1 10 0" />
    </>
  ),
  circlePlus: (
    <>
      <Circle cx={12} cy={12} r={8} />
      <Path d="M12 8v8M8 12h8" />
    </>
  ),
  map: (
    <>
      <Path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <Path d="M9 4v14M15 6v14" />
    </>
  ),
  trail: (
    <>
      <Circle cx={6} cy={7} r={2.4} />
      <Circle cx={18} cy={17} r={2.4} />
      <Path d="M8 7h6a4 4 0 0 1 0 8H8" />
    </>
  ),
  plus: <Path d="M12 5v14M5 12h14" />,
  bookmark: <Path d="M6 3h12v18l-6-4-6 4z" />,
  user: (
    <>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M5 21a7 7 0 0 1 14 0" />
    </>
  ),
  sparkle: <Path d="M12 3l1.9 5.8H20l-5 3.6 1.9 5.8L12 15l-4.9 3.2L9 12.4 4 8.8h6.1z" />,
  arrowLeft: (
    <>
      <Path d="M9 18l-6-6 6-6" />
      <Path d="M3 12h18" />
    </>
  ),
  chevronLeft: <Path d="M15 18l-6-6 6-6" />,
  chevronRight: <Path d="M9 6l6 6-6 6" />,
  pin: (
    <>
      <Path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />
      <Circle cx={12} cy={10} r={2.5} />
    </>
  ),
  pinSolid: <Path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />,
  play: <Path d="M7 5v14l12-7z" />,
  pause: <Path d="M8 5h3v14H8zM13 5h3v14h-3z" />,
  /** o punho do slider passado↔presente */
  handle: <Path d="M8 7l-4 5 4 5M16 7l4 5-4 5" />,
  share: <Path d="M14 9V5l7 7-7 7v-4H3V9z" />,
  clock: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 8v4l3 2" />
    </>
  ),
  timeline: (
    <>
      <Path d="M12 20a8 8 0 1 0-8-8" />
      <Path d="M12 8v4l3 2" />
    </>
  ),
  flag: <Path d="M4 22V4h13l-2 4 2 4H6" />,
  shield: <Path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z" />,
  shieldCheck: (
    <>
      <Path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z" />
      <Path d="M9.5 12l1.8 1.8L15 10" />
    </>
  ),
  checkCircle: (
    <>
      <Path d="M9 12l2 2 4-4" />
      <Circle cx={12} cy={12} r={9} />
    </>
  ),
  x: <Path d="M6 6l12 12M18 6L6 18" />,
  list: <Path d="M4 7h16M4 12h16M4 17h10" />,
  accessibility: (
    <>
      <Circle cx={12} cy={12} r={4} />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  star: <Path d="M12 2l3 6 6 .9-4.5 4.3 1 6L12 17l-5.5 3 1-6L3 8.9 9 8z" />,
  image: (
    <>
      <Path d="M3 5h18v14H3z" />
      <Circle cx={8.5} cy={10} r={1.8} />
      <Path d="M21 16l-5-5-6 6" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof glyphs;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** para ícones sólidos (play, pinSolid): pinta em vez de traçar */
  filled?: boolean;
}

export function Icon({ name, size = 24, color, strokeWidth = 2, filled }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={filled ? 'none' : color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {glyphs[name]}
    </Svg>
  );
}
