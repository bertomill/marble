#!/bin/bash
set -e

# Configuration
PROJECT_ID=$(gcloud config get-value project)
IMAGE_NAME="sitestack-simple-api"
REGION="us-central1"  # Change this if you prefer a different region
SERVICE_NAME="sitestack-simple-api"

# Build the Docker image (specify the platform for Cloud Run - amd64/linux)
echo "Building Docker image..."
docker build --platform linux/amd64 -t $IMAGE_NAME -f Dockerfile.simple .

# Tag the image for Google Container Registry
echo "Tagging image for Google Container Registry..."
docker tag $IMAGE_NAME gcr.io/$PROJECT_ID/$IMAGE_NAME

# Push the image to Google Container Registry
echo "Pushing image to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --port 8080

echo "Deployment complete!"
echo "Your simple API is now available at: $(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')" 