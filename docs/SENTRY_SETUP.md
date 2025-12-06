# Sentry Error Tracking Setup (Optional)

## Installation

```bash
npm install --save @sentry/nextjs
```

## Configuration

1. **Initialize Sentry**
```bash
npx @sentry/wizard@latest -i nextjs
```

2. **Add to next.config.ts**
```typescript
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // ... your existing config
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: 'your-org',
  project: 'campfire',
});
```

3. **Create sentry.client.config.ts**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

4. **Create sentry.server.config.ts**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

## Environment Variables

```env
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

## Features

- ✅ Automatic error tracking
- ✅ Performance monitoring
- ✅ Release tracking
- ✅ Source maps upload
- ✅ User context

## Usage

```typescript
// Manual error tracking
import * as Sentry from '@sentry/nextjs';

try {
  // Your code
} catch (error) {
  Sentry.captureException(error);
}

// Add user context
Sentry.setUser({
  id: user.id,
  email: user.email,
});
```

## Testing

```bash
# Trigger test error
throw new Error('Sentry test error');
```

Check your Sentry dashboard for the error report.
