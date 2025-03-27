# Website Design Collector Script

This script automatically collects design data from websites and stores it in Firebase. It can analyze a single website or multiple websites in a specific industry.

## Features

- Captures full-page screenshots of websites
- Extracts design elements (colors, fonts, component styles)
- Uses AI to analyze screenshots and identify UI components
- Stores all data in Firebase (Firestore and Storage)
- Supports batch processing of multiple websites by industry

## Prerequisites

1. Node.js installed (v14 or later)
2. Firebase project with Firestore and Storage enabled
3. OpenAI API key
4. Firebase Admin SDK service account key

## Setup

1. Install dependencies:
   ```
   npm install puppeteer uuid firebase-admin openai
   ```

2. Create a Firebase service account key:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file as `serviceAccountKey.json` in the project root

3. Set your OpenAI API key as an environment variable:
   ```
   export OPENAI_API_KEY=your_api_key_here
   ```

## Usage

Run the script:
```
node scripts/website-design-collector.js
```

The script will prompt you to:
1. Choose a mode (single website or industry analysis)
2. Enter a website URL or industry name
3. Specify how many websites to analyze (for industry mode)

## Output

The script will:
1. Save all data to your Firebase Firestore database in the `websiteExamples` collection
2. Upload screenshots to Firebase Storage
3. Save a local JSON file with the complete analysis results in the `output` directory

## Example

```
===== Website Design Collector =====
This script will analyze websites and save design data to Firebase

Choose mode:
1. Analyze a single website
2. Analyze an industry
Enter choice (1 or 2): 2

Enter industry name: E-commerce
Number of websites to analyze (default: 5): 3

Starting analysis for 3 websites in E-commerce industry...
Found 3 websites for E-commerce

Analyzing website 1/3: https://www.shopify.com...
[Analysis details...]

Analyzing website 2/3: https://www.amazon.com...
[Analysis details...]

Analyzing website 3/3: https://www.etsy.com...
[Analysis details...]

Analysis completed successfully!
Analyzed 3 websites
Full analysis saved to: /Users/bertomill/sitestack/output/industry_E-commerce_1711528362047.json
```
