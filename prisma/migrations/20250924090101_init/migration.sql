-- CreateTable
CREATE TABLE `hotel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `floor` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `originalPrice` DOUBLE NOT NULL,
    `afterHoursPrice` DOUBLE NOT NULL,
    `dayPrice` DOUBLE NOT NULL,
    `nightPrice` DOUBLE NOT NULL,
    `description` VARCHAR(191) NULL,
    `typeHire` INTEGER NOT NULL DEFAULT 0,
    `status` BOOLEAN NOT NULL,
    `hotelId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `room_hotelId_idx`(`hotelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `passwordManage` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `hotelId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utility` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `icon` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `hotelId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `utility_hotelId_idx`(`hotelId`),
    UNIQUE INDEX `utility_hotelId_name_key`(`hotelId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `checkin` DATETIME(3) NOT NULL,
    `checkout` DATETIME(3) NULL,
    `documentInfo` JSON NULL,
    `carInfo` JSON NULL,
    `surcharge` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `booking_roomId_checkin_idx`(`roomId`, `checkin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `note` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `Content` VARCHAR(191) NULL,
    `Discount` DOUBLE NOT NULL DEFAULT 0,
    `PayInAdvance` DOUBLE NOT NULL DEFAULT 0,
    `NegotiatedPrice` DOUBLE NULL,
    `BookingPricingId` VARCHAR(191) NULL,
    `bookingId` INTEGER NOT NULL,

    UNIQUE INDEX `note_bookingId_key`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookingitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilitiesId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `price` DOUBLE NULL,
    `name` VARCHAR(191) NULL,
    `bookingId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bookingitem_utilitiesId_idx`(`utilitiesId`),
    INDEX `bookingitem_bookingId_idx`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookingpricing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER NOT NULL,
    `roomId` INTEGER NULL,
    `priceType` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NULL,
    `calculatedAmount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bookingpricing_bookingId_idx`(`bookingId`),
    INDEX `bookingpricing_roomId_idx`(`roomId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pricinghistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` ENUM('CREATE', 'CHANGE_TYPE', 'DISCOUNT', 'PREPAID', 'NEGOTIATE', 'SURCHARGE', 'CHANGE_ROOM') NOT NULL,
    `priceType` VARCHAR(191) NULL,
    `amount` DOUBLE NULL,
    `description` VARCHAR(191) NULL,
    `appliedFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `appliedTo` DATETIME(3) NULL,
    `appliedFirstHourPrice` DOUBLE NOT NULL DEFAULT 0,
    `appliedNextHourPrice` DOUBLE NOT NULL DEFAULT 0,
    `appliedDayPrice` DOUBLE NOT NULL DEFAULT 0,
    `appliedNightPrice` DOUBLE NOT NULL DEFAULT 0,
    `bookingPricingId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bill` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `totalRoomPrice` DOUBLE NOT NULL,
    `totalUtilitiesPrice` DOUBLE NOT NULL,
    `roomId` INTEGER NOT NULL,
    `hotelId` INTEGER NOT NULL,
    `checkIn` DATETIME(3) NOT NULL,
    `checkOut` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bill_roomId_idx`(`roomId`),
    INDEX `bill_hotelId_idx`(`hotelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NOT NULL DEFAULT '',
    `hotelId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `room` ADD CONSTRAINT `room_hotelId_fkey` FOREIGN KEY (`hotelId`) REFERENCES `hotel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_hotelId_fkey` FOREIGN KEY (`hotelId`) REFERENCES `hotel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `utility` ADD CONSTRAINT `utility_hotelId_fkey` FOREIGN KEY (`hotelId`) REFERENCES `hotel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking` ADD CONSTRAINT `booking_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note` ADD CONSTRAINT `note_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookingitem` ADD CONSTRAINT `bookingitem_utilitiesId_fkey` FOREIGN KEY (`utilitiesId`) REFERENCES `utility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookingitem` ADD CONSTRAINT `bookingitem_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookingpricing` ADD CONSTRAINT `bookingpricing_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookingpricing` ADD CONSTRAINT `bookingpricing_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pricinghistory` ADD CONSTRAINT `pricinghistory_bookingPricingId_fkey` FOREIGN KEY (`bookingPricingId`) REFERENCES `bookingpricing`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill` ADD CONSTRAINT `bill_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill` ADD CONSTRAINT `bill_hotelId_fkey` FOREIGN KEY (`hotelId`) REFERENCES `hotel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_hotelId_fkey` FOREIGN KEY (`hotelId`) REFERENCES `hotel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
