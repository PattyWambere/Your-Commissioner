# Real Estate Marketplace

A comprehensive real estate marketplace web application built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

### For Buyers, Renters, and General Users
- Browse properties with advanced search and filters
- View detailed property information (size, price, location, amenities)
- Compare multiple properties side-by-side
- Access property owner/commissioner details
- Open Google Maps location links
- Start WhatsApp chats with property owners
- Download PDF brochures for properties
- Request physical viewing appointments

### For Commissioners
- Secure dashboard with analytics
- Create, update, and delete property listings
- Upload and manage property images
- View analytics (views, leads, chats, inquiries)
- Manage leads and inquiries
- Handle viewing appointment requests
- Track best-performing properties

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication
- **PDF Generation**: PDFKit
- **UI Components**: Lucide React Icons, React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database server
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd realestate
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: Your PostgreSQL connection string (format: `postgresql://user:password@localhost:5432/database_name`)
- `JWT_SECRET`: A secure random string for JWT token signing
- Email/SMS configuration (optional)

4. Set up the database:
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
realestate/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── properties/   # Property CRUD endpoints
│   │   ├── leads/        # Lead management
│   │   ├── appointments/ # Appointment management
│   │   └── dashboard/    # Dashboard analytics
│   ├── properties/       # Property pages
│   ├── dashboard/         # Commissioner dashboard
│   ├── login/             # Login page
│   └── register/          # Registration page
├── components/            # React components
├── lib/                   # Utility functions
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # Authentication utilities
│   └── utils.ts          # Helper functions
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## Database Schema

The application uses the following main models:
- **User**: Users (buyers, commissioners, admins)
- **Property**: Property listings
- **PropertyMedia**: Property images
- **PropertyAnalytics**: View/chat/inquiry analytics
- **Lead**: Lead tracking
- **Appointment**: Viewing appointments
- **Message**: Chat messages (optional)
- **Notification**: User notifications

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - List properties (with filters)
- `POST /api/properties` - Create property (commissioner only)
- `GET /api/properties/[id]` - Get property details
- `PATCH /api/properties/[id]` - Update property (owner only)
- `DELETE /api/properties/[id]` - Delete property (owner only)
- `GET /api/properties/[id]/brochure` - Download PDF brochure
- `GET /api/properties/compare` - Compare properties

### Leads & Appointments
- `POST /api/leads` - Create lead/inquiry
- `GET /api/leads` - Get leads (commissioner only)
- `PATCH /api/leads/[id]` - Update lead status
- `POST /api/appointments` - Request appointment
- `GET /api/appointments` - Get appointments (commissioner only)
- `PATCH /api/appointments/[id]` - Update appointment status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (commissioner only)

## Usage

### Creating a Commissioner Account

1. Register at `/register`
2. Select "Commissioner" as your role
3. Login and access the dashboard at `/dashboard`

### Adding a Property

1. Login as a commissioner
2. Go to Dashboard → Properties
3. Click "Add Property"
4. Fill in property details
5. Upload images
6. Save

### Searching Properties

1. Go to `/properties`
2. Use the search bar or filters
3. Click on a property to view details
4. Use "Compare" to select multiple properties

### Requesting a Viewing

1. View a property detail page
2. Click "Request Viewing"
3. Fill in the appointment form
4. Submit

## Development

### Database Commands

```bash
# Generate Prisma Client after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Building for Production

```bash
npm run build
npm start
```

## Environment Variables

See `.env.example` for all required environment variables.

## Features Not Included (By Design)

- Google Maps API integration (manual links only)
- Online payment processing
- Team management
- Advanced fraud detection
- Commission tracking

## Future Enhancements

- Real-time chat system
- SMS notifications
- Email notifications
- Advanced analytics dashboard
- Property favorites/bookmarks
- User reviews and ratings

## License

[Your License Here]

## Support

For issues and questions, please contact [your contact information].

