const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mariaresorts.com' },
    update: {},
    create: {
      email: 'admin@mariaresorts.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('Created admin user:', admin.email);

  // Create accountant user
  const accountantPassword = await bcrypt.hash('accountant123', 10);
  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@mariaresorts.com' },
    update: {},
    create: {
      email: 'accountant@mariaresorts.com',
      password: accountantPassword,
      name: 'Accountant User',
      role: 'ACCOUNTANT',
    },
  });

  console.log('Created accountant user:', accountant.email);

  // Create front desk user
  const frontdeskPassword = await bcrypt.hash('frontdesk123', 10);
  const frontdesk = await prisma.user.upsert({
    where: { email: 'frontdesk@mariaresorts.com' },
    update: {},
    create: {
      email: 'frontdesk@mariaresorts.com',
      password: frontdeskPassword,
      name: 'Front Desk User',
      role: 'FRONTDESK',
    },
  });

  console.log('Created front desk user:', frontdesk.email);

  // Create room categories
  const categories = await Promise.all([
    prisma.roomCategory.upsert({
      where: {        name: 'Single Room' },
      update: {},
      create: {
        name: 'Single Room',
        description: 'Comfortable single occupancy room',
        basePrice: 5000,
      },
    }),
    prisma.roomCategory.upsert({
      where: { name: 'Double Room' },
      update: {},
      create: {
        name: 'Double Room',
        description: 'Spacious double occupancy room',
        basePrice: 7500,
      },
    }),
    prisma.roomCategory.upsert({
      where: { name: 'Deluxe Suite' },
      update: {},
      create: {
        name: 'Deluxe Suite',
        description: 'Luxury suite with premium amenities',
        basePrice: 12000,
      },
    }),
    prisma.roomCategory.upsert({
      where: { name: 'Executive Suite' },
      update: {},
      create: {
        name: 'Executive Suite',
        description: 'Top-tier executive suite',
        basePrice: 18000,
      },
    }),
  ]);

  console.log(`Created ${categories.length} room categories`);

  // Create sample rooms
  const rooms = [];
  for (let i = 101; i <= 110; i++) {
    const room = await prisma.room.upsert({
      where: { roomNumber: i.toString() },
      update: {},
      create: {
        roomNumber: i.toString(),
        categoryId: categories[i % 2].id, // Alternate between categories
        floor: Math.floor(i / 100),
        status: 'AVAILABLE',
      },
    });
    rooms.push(room);
  }

  console.log(`Created ${rooms.length} sample rooms`);

  // Create food categories
  const foodCategories = await Promise.all([
    prisma.foodCategory.upsert({
      where: { name: 'Breakfast' },
      update: {},
      create: { name: 'Breakfast' },
    }),
    prisma.foodCategory.upsert({
      where: { name: 'Lunch' },
      update: {},
      create: { name: 'Lunch' },
    }),
    prisma.foodCategory.upsert({
      where: { name: 'Dinner' },
      update: {},
      create: { name: 'Dinner' },
    }),
    prisma.foodCategory.upsert({
      where: { name: 'Beverages' },
      update: {},
      create: { name: 'Beverages' },
    }),
  ]);

  console.log(`Created ${foodCategories.length} food categories`);

  // Create sample food items
  const foodItems = await Promise.all([
    prisma.foodMenuItem.create({
      data: {
        name: 'Continental Breakfast',
        categoryId: foodCategories[0].id,
        price: 800,
      },
    }),
    prisma.foodMenuItem.create({
      data: {
        name: 'Chicken Biryani',
        categoryId: foodCategories[1].id,
        price: 600,
      },
    }),
    prisma.foodMenuItem.create({
      data: {
        name: 'Grilled Fish',
        categoryId: foodCategories[2].id,
        price: 1200,
      },
    }),
    prisma.foodMenuItem.create({
      data: {
        name: 'Fresh Juice',
        categoryId: foodCategories[3].id,
        price: 250,
      },
    }),
  ]);

  console.log(`Created ${foodItems.length} food menu items`);

  // Create extra services
  const services = await Promise.all([
    prisma.extraService.create({
      data: {
        name: 'Laundry Service',
        description: 'Professional laundry and dry cleaning',
        price: 500,
      },
    }),
    prisma.extraService.create({
      data: {
        name: 'Airport Transfer',
        description: 'Pickup/drop-off to airport',
        price: 2000,
      },
    }),
    prisma.extraService.create({
      data: {
        name: 'Spa Treatment',
        description: 'Relaxing spa and massage',
        price: 3000,
      },
    }),
  ]);

  console.log(`Created ${services.length} extra services`);

  // Create sample vendor
  const vendor = await prisma.vendor.create({
    data: {
      name: 'Food Suppliers Co.',
      contactPerson: 'Ahmed Khan',
      phone: '+92-300-1234567',
      email: 'ahmed@foodsuppliers.com',
      services: 'Fresh produce and groceries',
    },
  });

  console.log('Created sample vendor:', vendor.name);

  console.log('✅ Database seeding completed successfully!');
  console.log('\nDefault user credentials:');
  console.log('Admin: admin@mariaresorts.com / admin123');
  console.log('Accountant: accountant@mariaresorts.com / accountant123');
  console.log('Front Desk: frontdesk@mariaresorts.com / frontdesk123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
