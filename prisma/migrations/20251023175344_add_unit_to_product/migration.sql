-- AlterTable
ALTER TABLE `customers` ADD COLUMN `last_name` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `unit` VARCHAR(191) NOT NULL DEFAULT 'pcs';
