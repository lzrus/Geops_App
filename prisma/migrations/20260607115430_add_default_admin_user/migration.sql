-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'user',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create default admin user
-- Password: admin123 (hashed with bcrypt, cost 10)
INSERT INTO `User` (`id`, `username`, `password`, `fullName`, `role`, `isActive`, `createdAt`, `updatedAt`)
VALUES (
    UUID(),
    'admin',
    '$2b$10$me62S6.OHpNS4sU2FiB7xubKohC1UJn3aobC4j4.di4H.8RmQKCki',
    'Administrateur',
    'admin',
    true,
    NOW(),
    NOW()
);
