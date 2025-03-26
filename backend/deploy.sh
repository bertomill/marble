#!/bin/bash
set -e

# Configuration
PROJECT_ID=$(gcloud config get-value project)
IMAGE_NAME="sitestack-api"
REGION="us-central1"  # Change this if you prefer a different region
SERVICE_NAME="sitestack-api"

# Build the Docker image (specify the platform for Cloud Run - amd64/linux)
echo "Building Docker image..."
docker build --platform linux/amd64 -t $IMAGE_NAME -f Dockerfile .

# Tag the image for Google Container Registry
echo "Tagging image for Google Container Registry..."
docker tag $IMAGE_NAME gcr.io/$PROJECT_ID/$IMAGE_NAME

# Push the image to Google Container Registry
echo "Pushing image to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
  # Try to extract from .env.local if it exists
  if [ -f .env.local ]; then
    OPENAI_API_KEY=$(grep OPENAI_API_KEY .env.local | cut -d '=' -f2)
  fi
  
  # If still not set, prompt the user
  if [ -z "$OPENAI_API_KEY" ]; then
    echo "OPENAI_API_KEY not found in environment or .env.local"
    read -p "Please enter your OpenAI API key: " OPENAI_API_KEY
  fi
fi

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --port 8080 \
  --set-env-vars="ENVIRONMENT=production,OPENAI_API_KEY=$OPENAI_API_KEY"

echo "Deployment complete!"
echo "Your API is now available at: $(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')"
