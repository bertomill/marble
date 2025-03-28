#!/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is required but not installed. Please install it first."
    echo "You can install it with: brew install imagemagick"
    exit 1
fi

# Generate 32x32 PNG favicon
convert -background none -size 32x32 favicon.svg public/favicon-32x32.png

# Generate 16x16 PNG favicon
convert -background none -size 16x16 favicon.svg public/favicon-16x16.png

echo "Favicons generated successfully in the public directory!" 