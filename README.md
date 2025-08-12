# InterviewAce Backend API

Backend API server for the InterviewAce interview preparation platform.

## Features

- **PDF Report Generation**: Generate professional interview preparation reports using Puppeteer
- **Stripe Integration**: Handle premium subscription payments
- **Email Service**: Send transactional emails via Mailgun
- **File Upload**: Handle CV uploads to Supabase Storage
- **Background Jobs**: Process long-running tasks with Redis and Bull
- **Authentication**: JWT-based auth with Supabase integration

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Queue**: Redis + Bull
- **PDF Generation**: Puppeteer
- **Email**: Mailgun
- **Payments**: Stripe
- **File Storage**: Supabase Storage

## Getting Started

### Prerequisites

- Node.js 18+
- Redis (for local development)
- Supabase project
- Stripe account
- Mailgun account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration

5. Build the project:
   ```bash
   npm run build
   ```

6. Start the server:
   ```bash
   npm start
   ```

For development:
```bash
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | No (default: 3001) |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `MAILGUN_API_KEY` | Mailgun API key | Yes |
| `MAILGUN_DOMAIN` | Mailgun domain | Yes |
| `REDIS_URL` | Redis connection URL | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `FRONTEND_URL` | Frontend application URL | Yes |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (webhook)
- `GET /api/auth/health` - Auth service health check

### Preparations
- `GET /api/preparations` - Get user preparations
- `GET /api/preparations/:id` - Get single preparation
- `POST /api/preparations` - Create new preparation
- `PUT /api/preparations/:id` - Update preparation
- `DELETE /api/preparations/:id` - Delete preparation

### PDF Generation
- `POST /api/pdf/generate` - Generate PDF report
- `GET /api/pdf/status/:jobId` - Check PDF generation status

### Stripe Payments
- `POST /api/stripe/create-checkout-session` - Create payment session
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `POST /api/stripe/create-portal-session` - Create customer portal

### File Upload
- `POST /api/upload/cv` - Upload CV file
- `DELETE /api/upload/cv` - Delete CV file

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics

## Deployment

### Heroku Deployment

1. Create Heroku app:
   ```bash
   heroku create your-app-name
   ```

2. Add buildpacks:
   ```bash
   heroku buildpacks:add heroku/nodejs
   heroku buildpacks:add jontewks/puppeteer
   ```

3. Add Redis addon:
   ```bash
   heroku addons:create heroku-redis:mini
   ```

4. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SUPABASE_URL=your-url
   # ... set all other env vars
   ```

5. Deploy:
   ```bash
   git push heroku main
   ```

6. Scale worker dyno:
   ```bash
   heroku ps:scale worker=1
   ```

### Required Heroku Add-ons

- **Heroku Redis**: For job queues and caching
- **Papertrail** (optional): For logging
- **New Relic** (optional): For monitoring

## Background Jobs

The application uses Redis and Bull for background job processing:

- **PDF Generation**: Generate reports asynchronously for premium users
- **Email Sending**: Send transactional emails
- **Welcome Emails**: Send welcome emails to new users

## Error Handling

- Comprehensive error handling middleware
- Structured logging with Winston
- Graceful shutdown handling
- Rate limiting protection

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- JWT token validation
- File upload restrictions
- Input validation with Joi

## Monitoring

- Health check endpoints
- Structured logging
- Error tracking
- Performance monitoring (with New Relic)

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details