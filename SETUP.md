# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up PostgreSQL Database**
- Create a PostgreSQL database (e.g., `realestate_db`)
- Update `.env` with your database connection string:
     ```
    DATABASE_URL="postgresql://username:password@localhost:5432/realestate_db"
     ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - A secure random string (generate with: `openssl rand -base64 32`)

4. **Initialize Database**
   ```bash
   # Generate Prisma Client
   npm run db:generate

   # Push schema to database
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open Application**
   - Navigate to http://localhost:3000
   - Register a commissioner account to start adding properties

## Creating Your First Property

1. Register/Login as a Commissioner
2. Go to Dashboard → Properties → Add Property
3. Fill in property details
4. Add property images (use image URLs for now)
5. Save and view your listing

## Image Upload

Currently, the system accepts image URLs. For production, you'll want to:
- Set up cloud storage (AWS S3, Cloudinary, etc.)
- Implement file upload endpoint
- Update media upload to handle file uploads

## Testing the Application

1. **As a Buyer/Renter:**
   - Browse properties at `/properties`
   - Use filters to find properties
   - View property details
   - Request viewing appointments
   - Compare properties

2. **As a Commissioner:**
   - Create property listings
   - View analytics dashboard
   - Manage leads and appointments
   - Update property status

## Database Management

- **View Database:** `npm run db:studio`
- **Create Migration:** `npm run db:migrate`
- **Reset Database:** Delete database and run `npm run db:push` again

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists
- Verify user permissions

### Authentication Issues
- Clear browser cookies
- Check JWT_SECRET is set
- Verify token expiration

### Build Issues
- Run `npm run db:generate` after schema changes
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Production Deployment

1. Set environment variables in production
2. Run `npm run build`
3. Start with `npm start`
4. Ensure PostgreSQL database is accessible
5. Set up reverse proxy (nginx) if needed
6. Configure SSL certificates

## Next Steps

- Set up email notifications (SMTP)
- Configure SMS notifications (Twilio)
- Implement file upload for images
- Add real-time chat (optional)
- Set up monitoring and logging

