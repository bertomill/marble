import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Modern background with animated elements */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black"></div>
        
        {/* Animated gradient meshes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-[5%] right-[10%] w-[50vw] h-[50vh] rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[10%] left-[5%] w-[40vw] h-[40vh] rounded-full bg-gradient-to-r from-indigo-500/20 to-pink-500/20 blur-[100px] animate-pulse-slower"></div>
          <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vh] rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 blur-[80px] animate-float"></div>
        </div>
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        ></div>
        
        {/* Subtle noise texture */}
        <div 
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          }}
        ></div>
        
        {/* Floating design elements */}
        <div className="absolute top-[15%] right-[15%] w-[150px] h-[150px] border border-white/10 rounded-full opacity-20 animate-float-slow"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[100px] h-[100px] border border-white/10 rounded-full opacity-20 animate-float-slower"></div>
        <div className="absolute top-[30%] left-[20%] w-[80px] h-[80px] border border-white/10 rounded-full opacity-20 animate-float"></div>
        
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-radial-gradient"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}