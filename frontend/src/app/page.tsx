'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ChevronDown, Zap, Shield, Globe, ArrowRight, Hexagon } from 'lucide-react';
import Link from 'next/link';

// Animated background components
function FloatingBee({ delay = 0 }: { delay?: number }) {
  const beeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (beeRef.current) {
      gsap.set(beeRef.current, {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      });
      
      gsap.to(beeRef.current, {
        x: `+=${Math.random() * 400 - 200}`,
        y: `+=${Math.random() * 200 - 100}`,
        duration: 8 + Math.random() * 4,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        delay,
      });
      
      gsap.to(beeRef.current, {
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: "none",
      });
    }
  }, [delay]);

  return (
    <div
      ref={beeRef}
      className="absolute w-6 h-6 text-nectar-gold opacity-30 pointer-events-none"
    >
      <div className="animate-bounce-slow">🐝</div>
    </div>
  );
}

function FloatingHexagon({ delay = 0 }: { delay?: number }) {
  const hexRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hexRef.current) {
      gsap.set(hexRef.current, {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      });
      
      gsap.to(hexRef.current, {
        x: `+=${Math.random() * 300 - 150}`,
        y: `+=${Math.random() * 300 - 150}`,
        rotation: 360,
        duration: 15 + Math.random() * 10,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        delay,
      });
    }
  }, [delay]);

  return (
    <div
      ref={hexRef}
      className="absolute opacity-20 pointer-events-none"
    >
      <Hexagon className="w-8 h-8 text-nectar-amber" />
    </div>
  );
}

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Floating Bees */}
      {Array.from({ length: 8 }).map((_, i) => (
        <FloatingBee key={`bee-${i}`} delay={i * 2} />
      ))}
      
      {/* Floating Hexagons */}
      {Array.from({ length: 6 }).map((_, i) => (
        <FloatingHexagon key={`hex-${i}`} delay={i * 3} />
      ))}
      
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-radial from-nectar-gold/5 via-transparent to-transparent" />
    </div>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.fromTo('.hero-title', 
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      );
      
      gsap.fromTo('.hero-subtitle', 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.3, ease: 'power3.out' }
      );
      
      gsap.fromTo('.hero-cta', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.6, ease: 'power3.out' }
      );

      // Feature cards stagger animation (simple fallback)
      gsap.fromTo('.feature-card', 
        { y: 60, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          stagger: 0.2,
          ease: 'power3.out',
          delay: 2
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-avalanche-dark text-avalanche-light overflow-hidden">
      <AnimatedBackground />
      
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center z-10">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-nectar-gold/20 rounded-full mb-6">
              <div className="text-4xl animate-pulse-slow">🍯</div>
            </div>
            <h1 className="hero-title text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-nectar-gold via-nectar-yellow to-nectar-orange bg-clip-text text-transparent">
              Nectar Network
            </h1>
            <p className="hero-subtitle text-xl md:text-2xl mb-8 text-gray-300 max-w-2xl mx-auto">
              The sweetest way to access decentralized computing power on <span className="text-avalanche-red font-semibold">Avalanche</span>
            </p>
            <p className="hero-subtitle text-lg mb-12 text-gray-400 max-w-3xl mx-auto">
              Connect compute providers and clients in a trustless marketplace. 
              Post jobs, earn rewards, and help build the future of distributed computing.
            </p>
          </div>
          
          <div className="hero-cta space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link href="/dashboard" className="inline-flex items-center px-8 py-4 bg-avalanche-red hover:bg-red-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              <span>Launch App</span>
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <button 
              onClick={scrollToFeatures}
              className="inline-flex items-center px-8 py-4 bg-nectar-gold/20 hover:bg-nectar-gold/30 text-nectar-gold border border-nectar-gold/50 font-semibold rounded-lg transition-all duration-300"
            >
              <span>Learn More</span>
              <ChevronDown className="ml-2 w-5 h-5 animate-bounce" />
            </button>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-nectar-gold/70" />
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="features-section relative py-20 px-4 sm:px-6 lg:px-8 bg-avalanche-darkGray/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-avalanche-light">
              Why Choose <span className="text-nectar-gold">Nectar Network</span>?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the power of decentralized computing with our innovative features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="feature-card bg-avalanche-darkGray/80 backdrop-blur-sm p-8 rounded-xl border border-nectar-gold/20 hover:border-nectar-gold/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-nectar-gold/20 rounded-lg mb-4">
                  <Zap className="w-8 h-8 text-nectar-gold" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-avalanche-light">Lightning Fast</h3>
                <p className="text-gray-300 leading-relaxed">
                  Powered by Avalanche's sub-second finality, experience near-instant job execution and payments
                </p>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="feature-card bg-avalanche-darkGray/80 backdrop-blur-sm p-8 rounded-xl border border-nectar-gold/20 hover:border-nectar-gold/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-avalanche-red/20 rounded-lg mb-4">
                  <Shield className="w-8 h-8 text-avalanche-red" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-avalanche-light">Secure & Trustless</h3>
                <p className="text-gray-300 leading-relaxed">
                  Smart contracts ensure automatic payments and dispute resolution without intermediaries
                </p>
              </div>
            </div>
            
            {/* Feature 3 */}
            <div className="feature-card bg-avalanche-darkGray/80 backdrop-blur-sm p-8 rounded-xl border border-nectar-gold/20 hover:border-nectar-gold/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-lg mb-4">
                  <Globe className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-avalanche-light">Global Network</h3>
                <p className="text-gray-300 leading-relaxed">
                  Access computing resources from providers worldwide, ensuring 24/7 availability
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-avalanche-light">
              How It <span className="text-nectar-gold">Works</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Three simple steps to harness the power of decentralized computing
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-nectar-gold/20 rounded-full text-3xl font-bold text-nectar-gold mb-6 border-4 border-nectar-gold/30">
                1
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-avalanche-light">Post Your Job</h3>
              <p className="text-gray-300 leading-relaxed">
                Describe your computing requirements, set a fair reward, and submit to the network
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-avalanche-red/20 rounded-full text-3xl font-bold text-avalanche-red mb-6 border-4 border-avalanche-red/30">
                2
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-avalanche-light">Provider Executes</h3>
              <p className="text-gray-300 leading-relaxed">
                Qualified compute providers compete to complete your job efficiently and securely
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full text-3xl font-bold text-green-400 mb-6 border-4 border-green-400/30">
                3
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-avalanche-light">Get Results</h3>
              <p className="text-gray-300 leading-relaxed">
                Receive your computed results while providers automatically get paid upon completion
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-avalanche-red/10 to-nectar-gold/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-avalanche-light">
            Ready to Join the <span className="text-nectar-gold">Swarm</span>?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Whether you need computing power or want to provide it, Nectar Network is your gateway to the decentralized future
          </p>
          
          <div className="space-y-4 sm:space-y-0 sm:space-x-6 sm:flex sm:justify-center">
            <Link href="/dashboard" className="inline-flex items-center px-10 py-4 bg-avalanche-red hover:bg-red-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-xl">
              <span>Start Computing</span>
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/dashboard" className="inline-flex items-center px-10 py-4 bg-nectar-gold hover:bg-yellow-500 text-avalanche-dark font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-xl">
              <span>Become a Provider</span>
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}