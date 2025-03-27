# Screenshot Analyzer Script

This script allows you to manually upload screenshots for AI analysis and store the results in Firebase. It's perfect for capturing design elements from websites with login flows, multi-step processes, or authentication requirements.

## Features

- Analyzes individual screenshots or entire directories of images
- Extracts UI components, colors, typography, and layout patterns
- Identifies functional purpose and user journey stages
- Uses OpenAI's GPT-4o for comprehensive design analysis
- Stores all data in Firebase (Firestore and Storage)
- Allows manual input of metadata for each screenshot

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
node scripts/analyze-screenshots.js
```

The script will prompt you to:
1. Choose a mode (single screenshot or directory of screenshots)
2. Enter the path to the screenshot(s)
3. Provide metadata for each screenshot (title, description, URL, etc.)

## Common Functional Labels for Searching

When adding tags to your screenshots, consider including these functional labels to make them more discoverable when users search for specific needs:

### User Journey Stages
- Onboarding
- Authentication
- Registration
- Dashboard
- Profile
- Settings
- Checkout
- Payment
- Confirmation
- Search Results
- Product Details
- Landing Page
- Conversion Page

### Functional Purposes
- User Authentication
- Data Visualization
- Content Management
- E-commerce
- Social Interaction
- Content Creation
- File Management
- Communication
- Scheduling
- Booking
- Analytics
- Reporting
- Account Management
- Subscription Management
- Learning/Education
- Collaboration
- Task Management
- Project Management
- Customer Support
- Resource Allocation
- Navigation

### Common User Tasks
- Sign Up
- Log In
- Reset Password
- Create Content
- Edit Profile
- Search for Items
- Filter Results
- Add to Cart
- Complete Purchase
- Share Content
- Upload Files
- Download Resources
- Schedule Appointments
- Track Progress
- Manage Permissions
- Review Information
- Submit Forms
- Provide Feedback
- Compare Options
- Customize Settings
- View Analytics

### Industry Categories
- SaaS
- E-commerce
- Finance
- Healthcare
- Education
- Travel
- Real Estate
- Media & Entertainment
- Social Media
- Productivity
- Enterprise
- B2B
- B2C
- Marketplace
- Gaming
- Fitness & Wellness

## Example Workflow

1. **Capture screenshots manually**:
   - Use browser developer tools to capture full-page screenshots
   - Use screen capture tools for specific components or flows
   - Save screenshots of login flows, dashboards, or authenticated pages

2. **Organize screenshots**:
   - Create a directory structure for your screenshots
   - Name files descriptively (e.g., `dashboard-logged-in.jpg`, `checkout-step-2.jpg`)

3. **Run the analyzer**:
   - Process individual screenshots or entire directories
   - Add metadata during the analysis process

4. **View results in SiteStack**:
   - All analyzed screenshots will appear in your SiteStack discover page
   - Components will be tagged and categorized for easy searching

## Output

The script will:
1. Save all data to your Firebase Firestore database in the `websiteExamples` collection
2. Upload screenshots to Firebase Storage
3. Save a local JSON file with the complete analysis results in the `output` directory

## Example

```
===== Screenshot Analyzer =====
This script will analyze screenshots and save design data to Firebase

Choose mode:
1. Analyze a single screenshot
2. Analyze a directory of screenshots
Enter choice (1 or 2): 1

Enter path to screenshot: /Users/bertomill/screenshots/login-flow.jpg
Enter title (or press Enter for default): Stripe Dashboard Login
Enter description (or press Enter for default): Clean login interface with two-factor authentication
Enter URL (or press Enter to skip): https://dashboard.stripe.com/login
Enter categories (comma-separated, or press Enter for default): Finance, SaaS
Enter tags (comma-separated, or press Enter for default): login, authentication, security

Starting analysis for /Users/bertomill/screenshots/login-flow.jpg...
[Analysis details...]

Analysis completed successfully!
Website saved with ID: 8f7e6d5c-4b3a-2a1c-0d9e-8f7e6d5c4b3a
Full analysis saved to: /Users/bertomill/sitestack/output/screenshot_8f7e6d5c-4b3a-2a1c-0d9e-8f7e6d5c4b3a.json
