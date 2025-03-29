'use client';

export default function VideoOnly() {
  return (
    <div style={{ padding: '20px', backgroundColor: 'black', color: 'white', minHeight: '100vh' }}>
      <h1>Video Only Test</h1>
      
      <video 
        controls
        width="600" 
        style={{ border: '1px solid #333', marginTop: '20px' }}
      >
        <source src="/videos/test.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      <p style={{ marginTop: '20px' }}>This page only contains a basic video element.</p>
      
      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
          Back to Home
        </a>
      </div>
    </div>
  );
} 