/*
  Warnings:

  - You are about to alter the column `stock_quantity` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(65,30)`.
  - You are about to alter the column `quantity` on the `sale_items` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE `products` MODIFY `stock_quantity` DECIMAL(65, 30) NOT NULL;

-- AlterTable
ALTER TABLE `sale_items` MODIFY `quantity` DECIMAL(65, 30) NOT NULL;
