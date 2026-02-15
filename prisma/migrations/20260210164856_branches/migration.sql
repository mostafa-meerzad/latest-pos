/*
  Warnings:

  - A unique constraint covering the columns `[category_name,branch_id]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone,branch_id]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,branch_id]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone,branch_id]` on the table `delivery_drivers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[barcode,branch_id]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supplier_name,branch_id]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `categories_category_name_key` ON `categories`;

-- DropIndex
DROP INDEX `customers_email_key` ON `customers`;

-- DropIndex
DROP INDEX `customers_phone_key` ON `customers`;

-- DropIndex
DROP INDEX `delivery_drivers_phone_key` ON `delivery_drivers`;

-- DropIndex
DROP INDEX `products_barcode_key` ON `products`;

-- DropIndex
DROP INDEX `suppliers_supplier_name_key` ON `suppliers`;

-- AlterTable
ALTER TABLE `categories` ADD COLUMN `branch_id` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `customers` ADD COLUMN `branch_id` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `deliveries` ADD COLUMN `branch_id` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `delivery_drivers` ADD COLUMN `branch_id` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `branch_id` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `sales` ADD COLUMN `branch_id` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `suppliers` ADD COLUMN `branch_id` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `branch_id` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `branches` (
    `branch_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `is_main` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',

    UNIQUE INDEX `branches_name_key`(`name`),
    PRIMARY KEY (`branch_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `categories_category_name_branch_id_key` ON `categories`(`category_name`, `branch_id`);

-- CreateIndex
CREATE UNIQUE INDEX `customers_phone_branch_id_key` ON `customers`(`phone`, `branch_id`);

-- CreateIndex
CREATE UNIQUE INDEX `customers_email_branch_id_key` ON `customers`(`email`, `branch_id`);

-- CreateIndex
CREATE INDEX `deliveries_branch_id_fkey` ON `deliveries`(`branch_id`);

-- CreateIndex
CREATE UNIQUE INDEX `delivery_drivers_phone_branch_id_key` ON `delivery_drivers`(`phone`, `branch_id`);

-- CreateIndex
CREATE INDEX `products_branch_id_fkey` ON `products`(`branch_id`);

-- CreateIndex
CREATE UNIQUE INDEX `products_barcode_branch_id_key` ON `products`(`barcode`, `branch_id`);

-- CreateIndex
CREATE INDEX `sales_branch_id_fkey` ON `sales`(`branch_id`);

-- CreateIndex
CREATE UNIQUE INDEX `suppliers_supplier_name_branch_id_key` ON `suppliers`(`supplier_name`, `branch_id`);

-- CreateIndex
CREATE INDEX `users_branch_id_fkey` ON `users`(`branch_id`);

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`branch_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`branch_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`branch_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`branch_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`branch_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`branch_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_drivers` ADD CONSTRAINT `delivery_drivers_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`branch_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`branch_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
