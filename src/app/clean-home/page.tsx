'use client';

import heroImage from '../assets/hero.png';
import Link from 'next/link';
import Image from 'next/image';

export default function CleanHome() {
  return (
    <main className="min-h-screen bg-black">
      <div className="bg-gray-900 text-white px-6 py-4">
        <h1 className="text-2xl font-bold">Marble</h1>
      </div>
      
      {/* Hero section with modern design */}
      <section className="relative min-h-[70vh] bg-black overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          {/* Image Background using Next.js Image */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <div className="absolute inset-0 opacity-60">
              <Image
                src={heroImage}
                alt="Background image"
                fill
                priority
                sizes="100vw"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                  transform: 'scale(1.05)'
                }}
              />
            </div>
            
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black opacity-60"></div>
          </div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-3xl md:text-6xl font-bold text-white mb-8 leading-tight">
            <span className="block">discover and share</span>
            <span className="block">beautiful digital experiences</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mt-8 max-w-3xl mx-auto">
            Join our growing community of world-class designers and developers. 
            Access over 10,000 premiere digital screens and components.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Link 
              href="/server-assets" 
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-black text-lg font-medium rounded-lg hover:bg-gray-200 transition duration-300"
            >
              Server Assets Demo
            </Link>
            <Link 
              href="/image-test" 
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white text-lg font-medium rounded-lg hover:bg-white/10 transition duration-300 backdrop-blur-sm border border-white/20"
            >
              Public Assets Demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
} 