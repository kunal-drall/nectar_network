'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface BeeProps {
  size?: number;
  delay?: number;
  x?: number;
  y?: number;
}

export default function FloatingBee({ 
  size = 24, 
  delay = 0,
  x = 0,
  y = 0 
}: BeeProps) {
  const beeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!beeRef.current) return;

    const element = beeRef.current;

    // Set initial position
    gsap.set(element, {
      x: x,
      y: y,
      rotation: 0,
    });

    // Create bee flying animation
    const tl = gsap.timeline({ repeat: -1, delay });

    tl.to(element, {
      x: x + 100,
      y: y - 20,
      rotation: 10,
      duration: 3,
      ease: "power2.inOut",
    })
    .to(element, {
      x: x + 50,
      y: y + 30,
      rotation: -5,
      duration: 2.5,
      ease: "power2.inOut",
    })
    .to(element, {
      x: x - 30,
      y: y - 10,
      rotation: 15,
      duration: 2.8,
      ease: "power2.inOut",
    })
    .to(element, {
      x: x,
      y: y,
      rotation: 0,
      duration: 2.2,
      ease: "power2.inOut",
    });

    return () => {
      tl.kill();
    };
  }, [delay, x, y]);

  return (
    <div
      ref={beeRef}
      className="absolute pointer-events-none z-10"
      style={{
        fontSize: size,
      }}
    >
      🐝
    </div>
  );
}