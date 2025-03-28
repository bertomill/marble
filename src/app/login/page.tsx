import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center"
        style={{ 
          backgroundImage: 'url("/images/marble-bg.jpg")',
          filter: 'brightness(0.7)'
        }}
      ></div>
      
      {/* Content */}
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}