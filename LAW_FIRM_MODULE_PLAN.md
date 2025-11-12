# Law Firm Module - Implementation Plan

## Overview
This document outlines the plan for integrating a law firm profile system with intelligent matching to provide users with the best lawyer recommendations based on their case.

## Current Implementation (Phase 1 - AI Generated)

### What's Live Now:
- **AI-Generated Recommendations**: LLM generates contextual lawyer recommendations based on:
  - Legal area (Personal Injury, Contract Law, etc.)
  - Jurisdiction (California, New York, etc.)
  - Case type and complexity
  
- **Data Displayed**:
  - Firm Name (AI-generated, generic names)
  - Specialty (matches the case type)
  - Location (matches jurisdiction)
  - Years of Experience (10-25 years)
  - Success Rate (85-95%)
  - Notable Wins (relevant case victories)
  - "AI Recommended Match" badge

### Backend Structure:
```python
# In llm-service/main.py, line ~510
# TODO comment marks where database integration will happen:
# Query will be: SELECT * FROM law_firms 
#                WHERE specialty LIKE %legal_area% 
#                AND location LIKE %jurisdiction% 
#                ORDER BY success_rate DESC LIMIT 3
```

## Future Implementation (Phase 2 - Database Integration)

### Database Schema

#### `law_firms` Table
```sql
CREATE TABLE law_firms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    firm_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile Information
    description TEXT,
    website VARCHAR(255),
    phone VARCHAR(20),
    founded_year INT,
    firm_size ENUM('Solo', '2-10', '11-50', '51-200', '200+'),
    
    -- Location
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'United States',
    
    -- Practice Areas (JSON array)
    specialties JSON, -- ["Personal Injury", "Auto Accidents", "Medical Malpractice"]
    
    -- Performance Metrics
    years_experience INT,
    total_cases_handled INT DEFAULT 0,
    cases_won INT DEFAULT 0,
    success_rate DECIMAL(5,2), -- Calculated: (cases_won / total_cases_handled) * 100
    
    -- Notable Achievements
    notable_cases TEXT, -- JSON array of case descriptions
    certifications TEXT, -- Bar admissions, certifications
    awards TEXT, -- Awards and recognitions
    
    -- Subscription & Status
    subscription_tier ENUM('Free', 'Basic', 'Premium', 'Enterprise') DEFAULT 'Free',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Analytics
    profile_views INT DEFAULT 0,
    contact_requests INT DEFAULT 0,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME,
    
    INDEX idx_specialties ((CAST(specialties AS CHAR(255) ARRAY))),
    INDEX idx_location (city, state),
    INDEX idx_success_rate (success_rate),
    INDEX idx_subscription (subscription_tier)
);
```

#### `law_firm_cases` Table (Case Portfolio)
```sql
CREATE TABLE law_firm_cases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    firm_id INT NOT NULL,
    
    -- Case Details
    case_type VARCHAR(100), -- "Personal Injury", "Auto Accident", etc.
    case_description TEXT,
    outcome ENUM('Won', 'Settled', 'Lost', 'Ongoing'),
    settlement_amount DECIMAL(15,2), -- Nullable for confidential cases
    
    -- Dates
    case_date DATE,
    resolution_date DATE,
    
    -- Display
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE, -- Can be hidden for confidentiality
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (firm_id) REFERENCES law_firms(id) ON DELETE CASCADE,
    INDEX idx_firm_outcome (firm_id, outcome),
    INDEX idx_case_type (case_type)
);
```

#### `law_firm_reviews` Table
```sql
CREATE TABLE law_firm_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    firm_id INT NOT NULL,
    user_id INT, -- Nullable for anonymous reviews
    
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    case_type VARCHAR(100),
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (firm_id) REFERENCES law_firms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_firm_rating (firm_id, rating)
);
```

#### `contact_requests` Table (Lead Tracking)
```sql
CREATE TABLE contact_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    firm_id INT NOT NULL,
    case_id INT, -- Link to the user's case
    
    -- Contact Info
    message TEXT,
    preferred_contact_method ENUM('Email', 'Phone', 'Message'),
    
    -- Status
    status ENUM('Pending', 'Contacted', 'Scheduled', 'Closed') DEFAULT 'Pending',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (firm_id) REFERENCES law_firms(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
    INDEX idx_firm_status (firm_id, status)
);
```

### Matching Algorithm

Replace the AI generation with database query:

```python
async def get_recommended_lawyers(legal_area: str, jurisdiction: str, case_details: dict):
    """
    Query database for best matching law firms based on:
    1. Specialty match
    2. Location proximity
    3. Success rate
    4. Experience level
    5. Subscription tier (premium firms ranked higher)
    """
    
    # Extract city and state from jurisdiction
    state = extract_state(jurisdiction)
    city = extract_city(jurisdiction)
    
    # Build query
    query = """
        SELECT 
            lf.id,
            lf.firm_name,
            lf.specialties,
            lf.city,
            lf.state,
            lf.years_experience,
            lf.success_rate,
            lf.subscription_tier,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'type', case_type,
                        'outcome', outcome,
                        'description', case_description,
                        'settlement', settlement_amount
                    )
                )
                FROM law_firm_cases
                WHERE firm_id = lf.id 
                AND is_featured = TRUE
                AND is_public = TRUE
                LIMIT 3
            ) as notable_cases,
            (
                SELECT AVG(rating)
                FROM law_firm_reviews
                WHERE firm_id = lf.id
            ) as avg_rating,
            (
                SELECT COUNT(*)
                FROM law_firm_reviews
                WHERE firm_id = lf.id
            ) as review_count
        FROM law_firms lf
        WHERE 
            lf.is_active = TRUE
            AND lf.is_verified = TRUE
            AND JSON_CONTAINS(lf.specialties, JSON_QUOTE(%s))
            AND (lf.state = %s OR %s IS NULL)
        ORDER BY
            -- Ranking factors
            (lf.subscription_tier = 'Enterprise') DESC,
            (lf.subscription_tier = 'Premium') DESC,
            lf.success_rate DESC,
            lf.years_experience DESC,
            avg_rating DESC
        LIMIT 3
    """
    
    results = db.execute(query, (legal_area, state, state))
    
    lawyers = []
    for row in results:
        # Extract notable win for display
        notable_win = "Specialized in complex legal matters"
        if row['notable_cases']:
            cases = json.loads(row['notable_cases'])
            if cases and len(cases) > 0:
                best_case = cases[0]
                if best_case['outcome'] == 'Won' and best_case['settlement']:
                    notable_win = f"Won ${best_case['settlement']:,.0f} settlement in {best_case['type'].lower()} case"
                else:
                    notable_win = best_case['description'][:100]
        
        lawyers.append({
            "name": row['firm_name'],
            "specialty": row['specialties'][0] if row['specialties'] else legal_area,
            "location": f"{row['city']}, {row['state']}",
            "rating": float(row['avg_rating']) if row['avg_rating'] else None,
            "recommended": True,
            "yearsExperience": row['years_experience'],
            "successRate": f"{row['success_rate']:.1f}%",
            "notableWins": notable_win,
            "firmId": row['id'],  # For contact button
            "reviewCount": row['review_count']
        })
    
    return lawyers
```

### API Endpoints to Build

#### Law Firm Auth & Profile
- `POST /api/law-firms/register` - Law firm registration
- `POST /api/law-firms/login` - Law firm login
- `GET /api/law-firms/profile` - Get firm profile
- `PUT /api/law-firms/profile` - Update firm profile
- `POST /api/law-firms/verify` - Submit for verification

#### Case Portfolio
- `POST /api/law-firms/cases` - Add case to portfolio
- `GET /api/law-firms/cases` - List firm's cases
- `PUT /api/law-firms/cases/:id` - Update case
- `DELETE /api/law-firms/cases/:id` - Remove case
- `PUT /api/law-firms/cases/:id/feature` - Feature a case

#### Contact & Leads
- `POST /api/contact-requests` - User contacts a firm
- `GET /api/law-firms/leads` - Firm views their leads
- `PUT /api/contact-requests/:id/status` - Update lead status

#### Search & Discovery
- `GET /api/law-firms/search` - Search firms (public)
- `GET /api/law-firms/:id` - Get firm public profile
- `POST /api/law-firms/:id/review` - Add review

### Frontend Components to Build

#### For Law Firms (New Portal)
1. **Registration/Onboarding Flow**
   - Basic info (name, email, password)
   - Profile setup (specialties, location, experience)
   - Case portfolio addition
   - Payment/subscription selection

2. **Firm Dashboard**
   - Profile completeness meter
   - Lead inbox (contact requests)
   - Analytics (profile views, clicks, conversions)
   - Case management

3. **Profile Editor**
   - Rich text editor for description
   - Specialty selector (multi-select)
   - Case portfolio manager
   - Media uploads (logo, photos)

#### For Users (Existing App)
1. **Enhanced Lawyer Cards** (Already done!)
   - Display real data from database
   - "Contact" button opens contact form
   - Link to full firm profile

2. **Contact Form Modal**
   - Message to firm
   - Case summary auto-populated
   - Preferred contact method

3. **Firm Profile Page**
   - Full firm information
   - Case portfolio
   - Reviews and ratings
   - Contact form

### Subscription Tiers & Monetization

| Feature | Free | Basic | Premium | Enterprise |
|---------|------|-------|---------|------------|
| Profile listing | ✓ | ✓ | ✓ | ✓ |
| Case portfolio (max) | 3 | 10 | Unlimited | Unlimited |
| Search ranking | Low | Medium | High | Highest |
| Contact requests/month | 5 | 25 | 100 | Unlimited |
| Featured badge | ✗ | ✗ | ✓ | ✓ |
| Analytics | Basic | Advanced | Advanced | Advanced |
| API access | ✗ | ✗ | ✗ | ✓ |
| **Price/month** | $0 | $99 | $299 | Custom |

### Migration Path

#### Step 1: Create Tables
- Run database migrations for all tables
- Seed with sample law firm data for testing

#### Step 2: Build Backend Service
- Create new `law-firm-service` (port 8008)
- Implement all API endpoints
- Add authentication for firms

#### Step 3: Update LLM Service
- Replace AI generation with database query
- Keep AI as fallback if no matches found
- Add comment: "// Using database matching as of [date]"

#### Step 4: Build Frontend
- Create law firm registration flow
- Build firm dashboard
- Add contact form modal for users

#### Step 5: Launch & Iterate
- Beta test with 5-10 law firms
- Gather feedback
- Refine matching algorithm
- Launch publicly

## Revenue Model

1. **Subscription Fees**: $99-$299/month from law firms
2. **Featured Placements**: Additional fee for top placement
3. **Pay-Per-Lead**: Optional model - charge per contact request
4. **Premium Features**: Logo uploads, video profiles, etc.

## Success Metrics

1. **For Law Firms**:
   - Number of qualified leads received
   - Lead-to-client conversion rate
   - Profile views and engagement

2. **For Users**:
   - Match relevance score (user feedback)
   - Contact completion rate
   - Time to find suitable lawyer

3. **For Platform**:
   - Number of law firms onboarded
   - Monthly recurring revenue (MRR)
   - User satisfaction with recommendations

## Timeline Estimate

- **Phase 1 (Current)**: AI-generated recommendations - ✅ DONE
- **Phase 2**: Database schema + backend API - 2-3 weeks
- **Phase 3**: Law firm portal frontend - 2-3 weeks
- **Phase 4**: Integration + testing - 1 week
- **Phase 5**: Beta launch - 1 week
- **Total**: ~6-8 weeks for MVP

## Notes

- Current AI generation provides realistic placeholder data
- System is architected to swap AI for database seamlessly
- Comment in code marks exact location for database integration
- Frontend already displays all fields that will come from database
- No UI changes needed when switching to real data
