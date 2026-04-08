# Maria Resorts - Hotel Management System

🚀 **Live Deployment:** [https://maria-resorts.vercel.app](https://maria-resorts.vercel.app)

A comprehensive hotel resort management system built with **Next.js**, **PostgreSQL**, and **Prisma ORM**. This system covers all essential hotel operations including guest management, room bookings, billing, vendor management, and financial reporting.

## 🚀 Features

### Core Operations
- ✅ **Guest Management** - Profiles, history, search by CNIC/passport
- ✅ **Room Management** - Categories, pricing, live availability dashboard
- ✅ **Reservations** - Walk-in & future bookings with status tracking
- ✅ **Check-in/Check-out** - Automatic status updates, late fee calculation
- ✅ **Billing System** - Auto bill generation, itemized invoices, PDF export
- ✅ **Payment Tracking** - Multiple methods (cash/bank/card), partial payments
- ✅ **Food & Services** - Menu management, add to guest bills
- ✅ **Vendor Management** - Profiles, transactions, payment tracking
- ✅ **Financial Reports** - Daily/monthly/overall revenue, occupancy reports
- ✅ **User Management** - Role-based access (Admin, Accountant, Front Desk)
- ✅ **Audit Logs** - Track all system actions

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL (with Prisma ORM)
- **Authentication**: JWT tokens + bcrypt
- **PDF Generation**: jsPDF
- **Charts**: Recharts

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or remote like Neon.tech)
- npm or yarn package manager

## ⚙️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
cd maria-resorts
npm install
```

### 2.Configure Database

Edit `.env` file with your PostgreSQL connection:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/maria_resorts"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NEXT_PUBLIC_APP_NAME="Maria Resorts Management"
```

**Free PostgreSQL Options:**
- **Local**: Install PostgreSQL locally
- **Remote**: Use [Neon.tech](https://neon.tech) (0.5GB free tier) or [Supabase](https://supabase.com) (500MB free)

### 3. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with sample data
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Default Login Credentials

After seeding, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@mariaresorts.com | admin123 |
| **Accountant** | accountant@mariaresorts.com | accountant123 |
| **Front Desk** | frontdesk@mariaresorts.com | frontdesk123 |

**⚠️ Important**: Change these passwords in production!

## 📁 Project Structure

``bash
maria-resorts/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Login, register
│   │   ├── guests/       # Guest management
│   │   ├── rooms/        # Room management
│   │   ├── reservations/ # Booking system
│   │   ├── checkins/     # Check-in/out
│   │   ├── billing/      # Invoice generation
│   │   ├── payments/     # Payment tracking
│   │   ├── food/         # Food menu
│   │   ├── services/     # Extra services
│   │   ├── vendors/      # Vendor management
│   │   ├── reports/      # Financial reports
│   │   └── users/        # User management
│   └── dashboard/        # Frontend pages
├── lib/
│   ├── prisma.ts         # Database client
│   ├── auth.ts           # JWT utilities
│   └── utils.ts          # Helper functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.js           # Sample data
└── middleware.ts         # Auth middleware
``

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (admin only)

### Guests
- `GET /api/guests` - List all guests, search
- `POST /api/guests` - Create guest
- `PUT /api/guests` - Update guest

### Rooms
- `GET /api/rooms` - List rooms with filters
- `GET /api/rooms/availability` - Live availability dashboard
- `POST /api/rooms` - Create room
- `PUT /api/rooms` - Update room status

### Reservations
- `GET /api/reservations` - List bookings
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations` - Update/cancel

### Check-ins
- `GET /api/checkins` - List check-ins
- `POST /api/checkins` - Check-in guest
- `PUT /api/checkins` - Check-out guest

### Billing
- `GET /api/billing` - Get bills
- `POST /api/billing` - Generate bill
- `PUT /api/billing` - Add items to bill

### Payments
- `GET /api/payments` - Get payments for bill
- `POST /api/payments` - Record payment

### Reports
- `GET /api/reports?type=daily&date=YYYY-MM-DD` - Daily report
- `GET /api/reports?type=monthly&date=YYYY-MM` - Monthly report
- `GET /api/reports?type=overall` - Overall financials
- `GET /api/reports?type=occupancy` - Occupancy stats

## 🔒 Role-Based Permissions

| Feature | Admin | Accountant | Front Desk |
|---------|-------|------------|------------|
| User Management | ✅ | ❌ | ❌ |
| Guest Management | ✅ | ❌ | ✅ |
| Room Management | ✅ | ❌ | ✅ |
| Reservations | ✅ | ❌ | ✅ |
| Check-in/out | ✅ | ❌ | ✅ |
| Billing | ✅ | ✅ | ✅ |
| Payments | ✅ | ✅ | ❌ |
| Vendor Management | ✅ | ✅ | ❌ |
| Financial Reports | ✅ | ✅ | ❌ |

## 🗄️ Database Schema

The system uses the following main models:
- **User** - System users with roles
- **Guest** - Guest profiles
- **RoomCategory** - Room types and pricing
- **Room** - Individual rooms
- **Reservation** - Bookings
- **CheckIn** - Check-in/out records
- **Bill** - Invoices
- **BillItem** - Invoice line items
- **Payment** - Payment transactions
- **FoodMenuItem** - Food menu
- **ExtraService** - Additional services
- **Vendor** - Vendor profiles
- **VendorTransaction** - Vendor bills/payments
- **AuditLog** - System activity tracking

## 🚀 Deployment

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Database Hosting

- **Neon.tech**: Free 0.5GB PostgreSQL (recommended)
- **Supabase**: Free 500MB + built-in auth
- **Railway**: Combined app + database hosting

## 📝 Development Notes

- The API uses JWT tokens for authentication
- All routes except login require Bearer token
- Audit logs track all create/update/delete operations
- Bills auto-calculate room charges on checkout
- Late checkout fees calculated automatically (2hr grace period)
- Tax rate is 5% (configurable in `lib/utils.ts`)

## 🔧 Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# View database in Prisma Studio
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma db push --force-reset

# Create database migration
npx prisma migrate dev --name your_migration_name
```

## 📄 License

MIT License - Free to use for your hotel resort!

## 🤝 Support

For issues or questions, contact the admin or check the API documentation above.

---

**Built with ❤️ using Next.js, PostgreSQL, and Prisma ORM**
# maria-resorts
