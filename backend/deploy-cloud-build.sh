#!/bin/bash
set -e

# Configuration
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"  # Change this if you prefer a different region

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

# Submit the build to Cloud Build
echo "Submitting build to Google Cloud Build..."
gcloud builds submit --config=cloudbuild-deploy.yaml --substitutions=_OPENAI_API_KEY="$OPENAI_API_KEY" .

echo "Deployment process started!"
echo "You can check the status in the Google Cloud Console: https://console.cloud.google.com/cloud-build/builds"
echo "Once complete, your API will be available at: https://sitestack-api-<hash>-uc.a.run.app"
echo "You can find the exact URL with: gcloud run services describe sitestack-api --platform managed --region $REGION --format 'value(status.url)'"
