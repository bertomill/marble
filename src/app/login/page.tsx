import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.7)' }}
      >
        <source src="/marble_ball.mp4" type="video/mp4" />
      </video>
      
      {/* Content */}
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}