# Marble Backend API

This is the backend API for Marble, providing color analysis, competitor research, and design assistance functionalities.

## Features

- **Color Extraction**: Extract dominant colors from images and websites
- **Color Palette Generation**: Generate harmonious color palettes
- **Website Analysis**: Extract colors, fonts, and technologies from websites
- **Competitor Analysis**: Find and analyze competitors in your industry using OpenAI's web search capabilities
- **Health check endpoint**: Verify the API is running correctly

## Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- OpenAI API key with web search access enabled

### Installation

1. Clone the repository
2. Set up a virtual environment and activate it:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install the required packages:

```bash
pip install -r requirements.txt
```

4. Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY=your_api_key_here  # On Windows: set OPENAI_API_KEY=your_api_key_here
```

Or create a `.env` file in the project root with:

```
OPENAI_API_KEY=your_api_key_here
```

### Run the API locally

Start the Flask development server:

```bash
python app.py
```

The API will be available at http://localhost:8080

## Endpoints

### General

- `GET /health`: Health check endpoint

### Color Analysis

- `POST /api/extract-colors`: Extract dominant colors from an image URL
- `POST /api/extract-from-website`: Extract colors, fonts and technologies from a website URL
- `POST /api/generate-palette`: Generate a color palette based on a base color

### Competitor Analysis (NEW)

- `POST /api/competitor/find`: Find competitors based on business description and industry using OpenAI web search
- `POST /api/competitor/analyze`: Analyze a competitor website using OpenAI web search
- `POST /api/competitor/status`: Check the status of ongoing competitor analysis jobs

## OpenAI Web Search Integration

Marble now uses OpenAI's web search capabilities to provide enhanced competitor analysis. This feature:

1. Finds relevant competitors in your industry based on your business description
2. Analyzes competitor websites to identify design patterns, strengths, weaknesses, and elements of inspiration
3. Provides structured data about each competitor that can be used to improve your own website

### How It Works

1. **Competitor Discovery**:
   - You provide a business description and industry
   - OpenAI searches the web to identify top competitors
   - The API returns structured data about each competitor

2. **Competitor Analysis**:
   - You provide a competitor's URL
   - OpenAI visits the website and performs a detailed analysis
   - The analysis includes visual design, features, content strategy, strengths, weaknesses, and more

3. **Status Checking**:
   - Analysis is performed asynchronously with job IDs
   - You can check the status of ongoing analyses

### Example Usage

#### Finding Competitors

Request:
```json
POST /api/competitor/find
{
  "businessDescription": "A SaaS platform for project management",
  "industry": "Software"
}
```

Response:
```json
{
  "competitors": [
    {
      "name": "Asana",
      "url": "https://asana.com",
      "description": "Work management platform for teams",
      "competitiveReason": "Leading project management software with similar features",
      "jobId": "job_123456"
    },
    ...
  ]
}
```

#### Analyzing a Competitor

Request:
```json
POST /api/competitor/analyze
{
  "url": "https://asana.com",
  "industry": "Software"
}
```

Response:
```json
{
  "message": "Analysis started",
  "jobId": "job_123456",
  "status": "processing"
}
```

#### Checking Analysis Status

Request:
```json
POST /api/competitor/status
{
  "jobIds": ["job_123456", "job_789012"]
}
```

Response:
```json
{
  "job_123456": {
    "status": "completed",
    "url": "https://asana.com",
    "created": 1647887283,
    "results": {
      "analysis": {
        "visualDesign": {
          "colors": ["#F06A6A", "#796EFF", "#FFB340", "#FFFFFF", "#2B2E3B"],
          "typography": ["Circular", "Helvetica", "sans-serif"],
          "layout": "Clean grid-based layout with intuitive navigation"
        },
        "keyFeatures": ["Task management", "Timeline views", "Team collaboration"],
        ...
      },
      "completedAt": 1647887350
    }
  },
  "job_789012": {
    "status": "processing",
    "url": "https://monday.com",
    "created": 1647887300
  }
}
```

## Deployment

The API is configured to be deployed on Google Cloud Run. Build and deploy with:

```bash
gcloud builds submit --tag gcr.io/YOUR-PROJECT-ID/sitestack-backend
gcloud run deploy --image gcr.io/YOUR-PROJECT-ID/sitestack-backend --platform managed
```

## Environment Variables

- `PORT`: The port the server will run on (default: 8080)
- `OPENAI_API_KEY`: Your OpenAI API key (required for competitor analysis)

## Development

### Adding New Endpoints

1. Create a new route in `app.py`
2. Implement the required functionality
3. Update this README to document the new endpoint

### Testing

Manual testing can be performed using tools like curl, Postman, or the built-in testing client. 