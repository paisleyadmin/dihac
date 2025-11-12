# DIHAC Mobile App

React Native mobile application for DIHAC.

## Setup

1. Install dependencies:
```bash
npm install
```

2. For iOS:
```bash
cd ios && pod install && cd ..
npm run ios
```

3. For Android:
```bash
npm run android
```

## Configuration

Update the API_URL in `src/contexts/AuthContext.js` to point to your backend API.

