# Legal Statute Linking System

## Overview
The case analysis panel now provides **clickable links** to relevant legal statutes from authoritative sources. Users can click any law to open the official statute in a new browser tab.

## Authoritative Sources Used

### Federal Laws
- **Cornell Legal Information Institute (LII)** - https://www.law.cornell.edu
  - Maintained by Cornell Law School
  - Free, authoritative, and comprehensive
  - Covers U.S. Code (USC) and Code of Federal Regulations (CFR)
  - Example: `18 U.S.C. § 1001` → https://www.law.cornell.edu/uscode/text/18/1001

### State Laws
Individual state official statute websites:

- **California**: https://leginfo.legislature.ca.gov
  - California Penal Code, Civil Code, etc.
  - Example: `California Penal Code § 187` → Direct link to statute

- **New York**: https://www.nysenate.gov/legislation/laws
  - NY Penal Law, Civil Practice Law, etc.
  - Example: `New York Penal Law § 120.00` → Direct link to statute

- **Texas**: https://statutes.capitol.texas.gov
  - Texas Penal Code, Civil Practice, etc.
  - Example: `Texas Penal Code § 22.01` → Direct link to statute

- **Florida**: http://www.leg.state.fl.us/statutes/
  - Florida Statutes
  - Example: `Florida Statute § 784.045` → Direct link to statute

- **Other states**: Links to official state statute repositories

## How It Works

### 1. AI Generates Specific Citations
The LLM is prompted to return laws in proper citation format:
- Federal: `18 U.S.C. § 1001` (Title 18, Section 1001)
- State: `California Civil Code § 1708`
- CFR: `29 CFR 1910.134`

### 2. Backend Parses and Generates URLs
The `generate_law_url()` function uses pattern matching to:
1. Identify the type of law (federal, state, code type)
2. Extract the statute numbers
3. Generate the correct URL to the official source

### 3. Frontend Displays Clickable Links
The Dashboard displays each law as a hyperlink with:
- Blue color (`#2563eb`)
- Underline on hover
- Opens in new tab (`target="_blank"`)

## Supported Citation Formats

### Federal Laws
✅ `18 U.S.C. § 1001`
✅ `Title 18 USC 1001`
✅ `42 U.S.C. § 1983`
✅ `29 CFR 1910.134`

### State Laws
✅ `California Penal Code § 187`
✅ `New York Penal Law § 120.00`
✅ `Texas Penal Code § 22.01`
✅ `Florida Statute § 784.045`
✅ `Illinois Compiled Statutes 720 ILCS 5/12-3`

## Fallback Behavior

If a law citation doesn't match known patterns:
1. **Federal laws**: Links to Cornell LII search with the law name
2. **State laws**: Links to that state's statute homepage
3. **Unknown**: Links to Cornell LII general search

## Example Output

When a user analyzes a rear-end collision case, they might see:
```
Potentially Relevant Laws:
• California Vehicle Code § 21703 (Following Too Closely)
• California Civil Code § 1714 (Duty of Care)
• 42 U.S.C. § 1983 (Civil Rights)
```

Each law is clickable and opens the official statute in a new tab.

## Benefits

1. **Authoritative**: Links only to official government sources or Cornell LII
2. **Educational**: Users can read the actual statute text
3. **Verifiable**: Allows users to verify the AI's legal citations
4. **Professional**: Shows serious legal research capabilities
5. **Free**: All sources are publicly accessible, no paywalls

## Technical Implementation

### Backend (Python)
```python
def generate_law_url(law_name: str) -> str:
    # Uses regex to identify citation patterns
    # Returns direct link to statute or search page
```

### Frontend (React)
```jsx
<Link href={law.url} target="_blank">
  {law.title}
</Link>
```

### AI Prompt
The LLM is instructed to:
- Use specific statute numbers
- Follow official citation format
- Example: "California Civil Code § 1708" not "California negligence law"

## Future Enhancements

Potential improvements:
- Add more state-specific parsers
- Support international laws (UK, Canada, etc.)
- Cache frequently accessed statutes
- Add tooltip previews of statute text
- Track which laws users click most often
- Suggest related statutes

## Testing

Try these test cases:
1. **Federal**: "Can I sue the police?" → Should cite `42 U.S.C. § 1983`
2. **California**: "Car accident in CA" → Should cite California Vehicle Code
3. **Criminal**: "Assault case" → Should cite state penal codes
4. **Contract**: "Breach of contract" → Should cite state civil codes

All citations should be clickable and open valid statute pages.
