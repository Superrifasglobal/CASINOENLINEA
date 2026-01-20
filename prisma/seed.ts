import { PrismaClient, Role } from '@prisma/client'
const prisma = new PrismaClient()

// ----------------------------------------------------------------------
// ADMIN WHITELIST
// Define the specific emails that should be Administrators here.
// ----------------------------------------------------------------------
const ADMIN_EMAILS = [
    'nexjmr07@gmail.com',
    'admin@example.com',
    // Add more admin emails here
]

async function main() {
    console.log('Start seeding...')

    // Ensure Admins exist and have the correct role
    for (const email of ADMIN_EMAILS) {
        const user = await prisma.user.upsert({
            where: { email },
            update: { role: Role.ADMIN }, // Force role to ADMIN if they already exist
            create: {
                email,
                name: 'Admin User',
                role: Role.ADMIN,
                balance: 0,
            },
        })
        console.log(`Upserted ADMIN user: ${user.email}`)
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
