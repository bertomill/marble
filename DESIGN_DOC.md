# Marble Design Document

## 1. Project Overview

### 1.1 Introduction
SiteStack is an AI-powered web application that helps users create professional websites by analyzing top designs in their industry. The system studies competitor websites, extracts design patterns, technology choices, and structural elements, then generates a customized website incorporating these best practices.

### 1.2 Problem Statement
Most website builders produce generic, basic websites that don't stand out. SiteStack solves this by showing users what the best websites in their category look like, then designing a similar but unique web application that embodies those quality standards.

### 1.3 Core Features
- Industry-specific website analysis
- Competitive research automation
- Design pattern extraction
- Technology stack identification
- Custom website generation
- Curated design recommendations

## 2. System Architecture

### 2.1 High-Level Components

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  User Interface     │────▶│  Analysis Engine    │────▶│  Website Generator  │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          ▲                           │                           │
          │                           ▼                           │
          │                 ┌─────────────────────┐              │
          │                 │                     │              │
          └─────────────────│  Data Repository    │◀─────────────┘
                            │                     │
                            └─────────────────────┘
```

### 2.2 Component Details

#### 2.2.1 User Interface
- **Web Application**: Next.js/React frontend
- **Dashboard**: Project management and website customization
- **Input Form**: Business/website requirements collection
- **Preview System**: Website preview and customization

#### 2.2.2 Analysis Engine
- **Web Search Module**: Uses OpenAI web search to find industry leaders
- **Computer Use Module**: Automates website analysis and captures visual assets
- **Design Analysis**: Extracts colors, typography, layouts, animations
- **Tech Stack Detector**: Identifies frameworks, libraries, and technologies

#### 2.2.3 Data Repository
- **PostgreSQL Database**: Structured data storage
- **OpenAI Vector Stores**: Semantic search capabilities
- **Asset Storage**: Cloud storage for screenshots, GIFs, and videos
- **Curated Dataset**: Pre-analyzed high-quality websites

#### 2.2.4 Website Generator
- **Template Engine**: Generates websites based on analysis
- **Component Library**: Reusable UI components 
- **Code Generator**: Produces customized code
- **Deployment System**: Publishes websites to hosting platforms

## 3. Data Model

### 3.1 Core Tables

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subscription_tier VARCHAR(50)
);

CREATE TABLE projects (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(255),
    industry VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50)
);

CREATE TABLE websites (
    id UUID PRIMARY KEY,
    url VARCHAR(255),
    name VARCHAR(255),
    industry_category VARCHAR(100),
    subcategory VARCHAR(100),
    capture_date TIMESTAMP,
    quality_score DECIMAL(3,2),
    is_curated BOOLEAN
);
```

### 3.2 Analysis Tables

```sql
CREATE TABLE visual_assets (
    id UUID PRIMARY KEY,
    website_id UUID REFERENCES websites(id),
    asset_type ENUM('screenshot', 'gif', 'video'),
    asset_category ENUM('homepage', 'landing_page', 'animation'),
    url VARCHAR(255),
    viewport_size VARCHAR(50),
    description TEXT
);

CREATE TABLE tech_stack (
    id UUID PRIMARY KEY,
    website_id UUID REFERENCES websites(id),
    category ENUM('frontend', 'backend', 'database', 'hosting', 'analytics', 'cms'),
    technology_name VARCHAR(100),
    version VARCHAR(50),
    confidence_score DECIMAL(3,2)
);

CREATE TABLE color_schemes (
    id UUID PRIMARY KEY,
    website_id UUID REFERENCES websites(id),
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    accent_colors JSON,
    background_color VARCHAR(7),
    text_color VARCHAR(7)
);

CREATE TABLE typography (
    id UUID PRIMARY KEY,
    website_id UUID REFERENCES websites(id),
    font_family VARCHAR(100),
    font_category ENUM('serif', 'sans-serif', 'display', 'monospace'),
    font_weights JSON,
    font_sizes JSON,
    line_height DECIMAL(4,2)
);

CREATE TABLE layouts (
    id UUID PRIMARY KEY,
    website_id UUID REFERENCES websites(id),
    layout_type ENUM('single-column', 'multi-column', 'grid', 'masonry'),
    responsive_approach VARCHAR(100),
    grid_system VARCHAR(50)
);

CREATE TABLE components (
    id UUID PRIMARY KEY,
    website_id UUID REFERENCES websites(id),
    component_type VARCHAR(100),
    position JSON,
    dimensions JSON,
    styling_pattern TEXT
);

CREATE TABLE animations (
    id UUID PRIMARY KEY,
    website_id UUID REFERENCES websites(id),
    animation_type VARCHAR(100),
    trigger_event VARCHAR(100),
    duration INTEGER,
    timing_function VARCHAR(50),
    implementation_method VARCHAR(100)
);
```

### 3.3 OpenAI Integration Tables

```sql
CREATE TABLE openai_vector_stores (
    id UUID PRIMARY KEY,
    openai_vector_store_id VARCHAR(255),
    name VARCHAR(100),
    category VARCHAR(100)
);

CREATE TABLE openai_files (
    id UUID PRIMARY KEY,
    openai_file_id VARCHAR(255),
    vector_store_id UUID REFERENCES openai_vector_stores(id),
    website_id UUID REFERENCES websites(id),
    file_type ENUM('screenshot', 'analysis_report', 'animation')
);
```

## 4. Technical Implementation

### 4.1 Frontend Stack
- **Framework**: Next.js 14+ with React 18
- **Styling**: Tailwind CSS
- **State Management**: React Context + SWR/React Query
- **Authentication**: NextAuth.js

### 4.2 Backend Stack
- **API**: Node.js with Express or Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **File Storage**: AWS S3 or similar cloud storage
- **Caching**: Redis

### 4.3 OpenAI Integration
- **Web Search Tool**: For competitor discovery
- **Vector Stores**: For knowledge base search
- **Computer Use Tool**: For automated analysis
- **Large Language Models**: For code generation and analysis

### 4.4 Website Generator
- **Code Generation**: Convert designs to working code
- **Framework Selection**: Based on tech stack analysis
- **Responsive Design**: Adaptive to multiple devices
- **SEO Optimization**: Built-in best practices
- **Performance Focus**: Optimized for Core Web Vitals

## 5. Data Collection Pipeline

### 5.1 Website Discovery
1. User inputs business type and keywords
2. System queries OpenAI web search with industry terms
3. Results are filtered for highest quality examples
4. User confirms selection of sites to analyze

### 5.2 Automated Analysis
1. Computer Use tool navigates to each website
2. Screenshots are captured at multiple viewports
3. Interactions are recorded for animation analysis
4. HTML/CSS is parsed for structural analysis
5. Colors, typography, and spacing are extracted

### 5.3 Data Storage
1. Visual assets uploaded to cloud storage
2. Analysis results stored in PostgreSQL
3. Reports generated and uploaded to OpenAI vector stores
4. Data tagged with metadata for future retrieval

### 5.4 Curated Database Building
1. Human experts review and rate analyzed websites
2. Top examples are marked as curated
3. Design patterns are categorized and tagged
4. Exemplary components are isolated and stored

## 6. Website Generation Process

### 6.1 User Input
1. Business information collection
2. Website goals and requirements
3. Target audience identification
4. Content type specification

### 6.2 Design Selection
1. System searches database for relevant examples
2. User selects preferred design patterns
3. Color schemes and typography presented for selection
4. Component options offered based on requirements

### 6.3 Site Generation
1. Base structure created from templates
2. Components assembled according to layout patterns
3. Styling applied based on design choices
4. Content placement determined by analysis
5. Responsive behavior implemented

### 6.4 Customization
1. User reviews generated website
2. Interactive editor for adjustments
3. Component swap options
4. Color and typography fine-tuning
5. Layout modification capabilities

## 7. Future Enhancements

### 7.1 Short-term
- Integration with popular CMS platforms
- E-commerce functionality
- Custom animation creation
- Advanced SEO tools

### 7.2 Long-term
- AI-generated content suggestions
- Real-time competitive analysis
- Automated marketing material generation
- Integration with business tools (CRM, analytics)

## 8. Development Roadmap

### 8.1 Phase 1: MVP (3 Months)
- Core database setup
- Basic website analysis functionality
- Simple template-based website generation
- User authentication and project management

### 8.2 Phase 2: Enhanced Analysis (3 Months)
- Advanced design pattern recognition
- Component-level analysis
- Tech stack detection improvements
- Expanded template library

### 8.3 Phase 3: Advanced Generation (4 Months)
- Custom code generation
- Interactive website builder
- Design customization tools
- Deployment system integration

### 8.4 Phase 4: AI Optimization (2 Months)
- Vector store integration
- Recommendation system improvements
- Performance optimization
- User experience enhancements 