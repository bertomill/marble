#!/bin/bash

# Script to deploy Firebase Firestore rules
# This script deploys both Firestore rules and indexes to your Firebase project

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null
then
    echo "Firebase CLI is not installed. Please install it first with:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    echo "You are not logged in to Firebase. Please login first with:"
    echo "firebase login"
    exit 1
fi

# Display the current project
echo "Current Firebase project:"
firebase projects:list | grep "(current)"

# Confirm before deploying
read -p "Do you want to deploy Firestore rules and indexes to this project? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Deployment cancelled."
    exit 1
fi

# Deploy Firestore rules
echo "Deploying Firestore rules and indexes..."
firebase deploy --only firestore:rules,firestore:indexes

# Check deployment status
if [ $? -eq 0 ]; then
    echo "✅ Successfully deployed Firestore rules and indexes!"
    echo "Your updated permissions for project management are now active."
else
    echo "❌ Deployment failed. Please check the errors above."
fi 