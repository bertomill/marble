import { CircularImage } from "@/components/ui/circular-image";

export default function ImageExamplePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-8">Circular Image Example</h1>
      
      <div className="flex flex-col items-center gap-8">
        {/* Example with default size */}
        <div>
          <h2 className="text-xl mb-2">Default Size (300px)</h2>
          <CircularImage 
            src="/marble_logo_circle.png" 
            alt="Marble Logo" 
          />
        </div>
        
        {/* Example with custom size */}
        <div>
          <h2 className="text-xl mb-2">Custom Size (200px)</h2>
          <CircularImage 
            src="/marble_logo_circle.png" 
            alt="Marble Logo" 
            size={200} 
          />
        </div>
        
        {/* Example with custom size and className */}
        <div>
          <h2 className="text-xl mb-2">With Border (150px)</h2>
          <CircularImage 
            src="/marble_logo_circle.png" 
            alt="Marble Logo" 
            size={150} 
            className="border-4 border-blue-500"
          />
        </div>
      </div>
    </div>
  );
} 