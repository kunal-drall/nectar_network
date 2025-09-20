'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface HexagonProps {
  size?: number;
  color?: string;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
}

export default function FloatingHexagon({ 
  size = 40, 
  color = 'primary-400',
  delay = 0,
  duration = 4,
  x = 0,
  y = 0 
}: HexagonProps) {
  const hexRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hexRef.current) return;

    const element = hexRef.current;

    // Set initial position
    gsap.set(element, {
      x: x,
      y: y,
      rotation: 0,
      opacity: 0.7,
    });

    // Create floating animation
    const tl = gsap.timeline({ repeat: -1, delay });

    tl.to(element, {
      y: y - 20,
      rotation: 180,
      duration: duration,
      ease: "power2.inOut",
    })
    .to(element, {
      y: y + 10,
      rotation: 360,
      duration: duration,
      ease: "power2.inOut",
    })
    .to(element, {
      y: y,
      rotation: 540,
      duration: duration,
      ease: "power2.inOut",
    });

    // Gentle horizontal drift
    gsap.to(element, {
      x: x + 30,
      duration: duration * 3,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });

    return () => {
      tl.kill();
    };
  }, [delay, duration, x, y]);

  return (
    <div
      ref={hexRef}
      className={`absolute hexagon bg-${color} opacity-70 hover:opacity-90 transition-opacity duration-300`}
      style={{
        width: size,
        height: size,
        pointerEvents: 'none',
      }}
    />
  );
}