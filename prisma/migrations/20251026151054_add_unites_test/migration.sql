/*
  Warnings:

  - You are about to drop the column `unit` on the `products` table. All the data in the column will be lost.
  - You are about to alter the column `stock_quantity` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Int`.
  - You are about to alter the column `quantity` on the `sale_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Int`.

*/
-- AlterTable
ALTER TABLE `products` DROP COLUMN `unit`,
    MODIFY `stock_quantity` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `sale_items` MODIFY `quantity` INTEGER NOT NULL;
