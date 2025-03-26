# SiteStack

A web application that helps you build better websites inspired by your industry's top performers. Analyze, learn, and create.

## Features

- **Competitor Analysis**: Find top competitors in your industry and analyze their websites
- **AI-Powered Insights**: Get detailed analysis of visual design, features, content strategy, strengths, and weaknesses
- **Design Tools**: Extract color palettes, typography, and technologies from websites
- **Inspiration Elements**: Identify what makes successful websites work and apply to your own

## Automated Competitor Analysis Workflow

SiteStack now features an improved workflow that automatically analyzes competitor websites:

1. Enter your business description and industry
2. The system finds relevant competitors using OpenAI's web search
3. Each competitor website is automatically analyzed in the background
4. Results are presented as they become available
5. Get detailed insights about each competitor's design, features, and strategies

This streamlined process eliminates the need to manually trigger analysis for each competitor, saving time and providing a smoother user experience.

## Setup

### Prerequisites

- Node.js 18+ (for the frontend)
- Python 3.8+ (for the backend)
- OpenAI API key with web search access enabled

### Frontend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sitestack.git
cd sitestack
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your configuration:
```
# Firebase configuration (if using auth)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# API configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set your OpenAI API key:
```bash
export OPENAI_API_KEY=your-openai-api-key-here  # On Windows: set OPENAI_API_KEY=your-openai-api-key-here
```

5. Start the backend server:
```bash
python app.py
```

The backend will be available at http://localhost:8080

## Using the Competitor Analysis Tool

1. Navigate to the Competitors section
2. Enter your business description and industry
3. The system will automatically:
   - Find top competitors in your industry
   - Analyze their websites using OpenAI's web search capability
   - Extract design patterns, features, strengths, and weaknesses
4. Review the analysis results to gain insights for your own website

## How It Works

1. The frontend sends a request with your business description and industry to the backend
2. The backend uses OpenAI's web search to find relevant competitors
3. For each competitor found, the backend automatically triggers a detailed analysis
4. The analysis results are returned to the frontend as they become available
5. You can view detailed insights about each competitor's website

## Development

- Frontend: Next.js with TypeScript, Tailwind CSS
- Backend: Flask with Python, integrated with OpenAI API
- Authentication: Firebase Auth (optional)

## License

This project is [MIT licensed](LICENSE).
