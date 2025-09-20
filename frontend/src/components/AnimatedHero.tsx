'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import FloatingHexagon from './FloatingHexagon';
import FloatingBee from './FloatingBee';

interface AnimatedHeroProps {
  children: React.ReactNode;
}

export default function AnimatedHero({ children }: AnimatedHeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current || !contentRef.current) return;

    const tl = gsap.timeline();

    // Animate hero content entrance
    tl.fromTo(contentRef.current, 
      { 
        opacity: 0, 
        y: 50,
        scale: 0.9 
      },
      { 
        opacity: 1, 
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: "power3.out" 
      }
    );

    return () => {
      tl.kill();
    };
  }, []);

  // Generate positions for floating elements (with fallbacks for SSR)
  const getRandomPosition = () => ({
    x: typeof window !== 'undefined' ? Math.random() * (window.innerWidth - 200) : Math.random() * 800,
    y: typeof window !== 'undefined' ? Math.random() * (window.innerHeight - 200) : Math.random() * 600,
  });

  const hexagons = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    ...getRandomPosition(),
    size: 30 + Math.random() * 40,
    color: ['primary-400', 'secondary-400', 'accent-400'][Math.floor(Math.random() * 3)],
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
  }));

  const bees = Array.from({ length: 4 }, (_, i) => ({
    id: i,
    ...getRandomPosition(),
    size: 20 + Math.random() * 8,
    delay: Math.random() * 3,
  }));

  return (
    <div ref={heroRef} className="relative min-h-screen overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {hexagons.map((hex) => (
          <FloatingHexagon
            key={`hex-${hex.id}`}
            size={hex.size}
            color={hex.color}
            delay={hex.delay}
            duration={hex.duration}
            x={hex.x}
            y={hex.y}
          />
        ))}
        
        {bees.map((bee) => (
          <FloatingBee
            key={`bee-${bee.id}`}
            size={bee.size}
            delay={bee.delay}
            x={bee.x}
            y={bee.y}
          />
        ))}
      </div>

      {/* Main Content */}
      <div ref={contentRef} className="relative z-20">
        {children}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-secondary-100/30 pointer-events-none z-10" />
    </div>
  );
}