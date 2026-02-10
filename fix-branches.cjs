const { PrismaClient } = require("./app/generated/prisma");

const prisma = new PrismaClient();

async function main() {
  console.log("Checking for branches...");
  const branchesCount = await prisma.branch.count().catch(() => 0);
  
  if (branchesCount === 0) {
    console.log("Creating Main Branch...");
    // Since we can't push the schema yet due to FK constraints, we might need to use raw SQL if the table doesn't exist
    // But db push should have created the table before trying to add FKs? 
    // Actually, db push fails the whole transaction usually.
    
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS branches (
                branch_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(191) UNIQUE NOT NULL,
                location VARCHAR(191),
                phone VARCHAR(191),
                is_main BOOLEAN DEFAULT FALSE,
                created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
                status VARCHAR(191) DEFAULT 'ACTIVE'
            )
        `);
        
        await prisma.$executeRawUnsafe(`
            INSERT IGNORE INTO branches (branch_id, name, is_main) VALUES (1, 'Main Branch', true)
        `);
        console.log("Main Branch created via raw SQL.");
    } catch (e) {
        console.error("Error creating branch:", e);
    }
  } else {
    console.log("Branches already exist.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
