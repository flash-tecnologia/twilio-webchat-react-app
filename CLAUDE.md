# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Twilio's open-source **Webchat React App** - an embeddable chat widget built with React, TypeScript, and Twilio's Conversations SDK. It provides a customizable webchat solution for Twilio Flex integration, consisting of a React frontend and Express.js backend server.

## Essential Commands

### Development Workflow
```bash
# Environment setup (required first)
yarn bootstrap accountSid=YOUR_ACCOUNT_SID authToken=YOUR_AUTH_TOKEN apiKey=YOUR_API_KEY_SID apiSecret=YOUR_API_SECRET addressSid=YOUR_ADDRESS_SID conversationsServiceSid=YOUR_CONVERSATIONS_SERVICE_SID

# Start backend server (port 3001)
yarn server

# Start React app (port 3000) 
yarn start

# Build production bundle (outputs single main.js file)
yarn build

# Run tests with watch mode
yarn test

# Run tests once
yarn test:nowatch

# Lint and auto-fix
yarn lint
```

### Specialized Commands
```bash
# Cleanup for E2E tests
yarn e2eCleanupExistingTasks

# Deploy (build + deploy script)
yarn deploy
```

## Architecture

### Frontend (React App)
- **Entry Point**: `WebchatWidget` component wraps everything in Twilio Paste CustomizationProvider
- **Phase-based Rendering**: `RootContainer` conditionally renders based on engagement phase (`PreEngagementForm`, `Loading`, `MessagingCanvas`)
- **State Management**: Redux with 4 main reducers (`chat`, `config`, `session`, `notifications`)
- **Session Persistence**: Uses localStorage for JWT tokens and conversation resumption
- **Component Pattern**: Co-located `.test.tsx` and `.styles.ts` files alongside components

### Backend (Express Server)
- **Key Endpoints**: 
  - `POST /initWebchat` - Initialize chat session, creates conversation & token
  - `POST /refreshToken` - Refresh expiring JWT tokens
  - `POST /email` - Send email transcripts via SendGrid
- **Security**: Origin validation middleware, CORS configuration, JWT token management

### Build Configuration (config-overrides.js)
- **Single Bundle Output**: No code splitting, produces `main.js` for easy embedding
- **No Filename Hashing**: Consistent filename for CDN deployment
- **Environment Variable Injection**: Transcript settings injected at build time

## Key Integration Points

### Twilio Conversations SDK
- Real-time messaging with typing indicators, read receipts
- File attachments with validation and size limits
- Connection state monitoring for network status notifications

### Widget Configuration
Initialize with `Twilio.initWebchat()` and these key options:
- `serverUrl`: Backend endpoint base URL
- `theme`: Twilio Paste theme customization with `isLight` boolean and `overrides` object
- `fileAttachment`: Enable/configure file uploads (`enabled`, `maxFileSize`, `acceptedExtensions`)
- `transcript`: Configure chat transcripts (`emailSubject`, `emailContent` functions)

## Development Notes

### Local Development Setup
1. Run `yarn bootstrap` with required Twilio credentials
2. Start backend with `yarn server` (localhost:3001)
3. Start frontend with `yarn start` (localhost:3000)
4. Clear session data: `localStorage.clear()` in browser console

### Testing Strategy
- **Unit Tests**: 33+ component tests with React Testing Library, Redux store tests, utility tests
- **E2E Tests**: Cypress configured for localhost:3000 with Page Object Model pattern
- **Mock Strategy**: Comprehensive Twilio Conversations SDK mocking

### Environment Variables
**Required**: `ACCOUNT_SID`, `AUTH_TOKEN`, `API_KEY`, `API_SECRET`, `ADDRESS_SID`, `CONVERSATIONS_SERVICE_SID`

**Optional**: `EMAIL_TRANSCRIPT_ENABLED`, `DOWNLOAD_TRANSCRIPT_ENABLED`, `SENDGRID_API_KEY`, `FROM_EMAIL`

### Code Quality
- ESLint with Twilio-specific rules (`eslint-config-twilio-react`, `eslint-config-twilio-ts`)
- TypeScript strict mode enabled
- Twilio Paste Design System for UI consistency
- Redux DevTools integration for state debugging

## Production Deployment

The build process creates a single `main.js` file in `/build/static/js/` that can be embedded with:
```html
<script src="https://your-cdn.com/main.js"></script>
<div id="twilio-webchat-widget-root"></div>
<script>
  Twilio.initWebchat({ serverUrl: "https://your-backend.com" });
</script>
```

## Common Issues

- **Session Clearing**: Use `localStorage.clear()` in browser console
- **Token Expiration**: Handled automatically via `/refreshToken` endpoint
- **Connection Issues**: Built-in connectivity notifications inform users of network status
- **File Attachments**: Configurable size limits and extension restrictions