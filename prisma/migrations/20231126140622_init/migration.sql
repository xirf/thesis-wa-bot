-- CreateTable
CREATE TABLE `Session` (
    `_id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `session` VARCHAR(191) NULL,

    UNIQUE INDEX `Session_sessionId_key`(`sessionId`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` VARCHAR(255) NOT NULL,
    `status` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dosen` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(255) NOT NULL,
    `nidn` VARCHAR(10) NOT NULL,
    `email` VARCHAR(255) NULL,
    `telepon` VARCHAR(13) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mahasiswa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(255) NOT NULL,
    `nim` VARCHAR(20) NOT NULL,
    `prodi` VARCHAR(255) NOT NULL,
    `tahun_ajar` INTEGER NOT NULL,
    `email` VARCHAR(255) NULL,
    `telepon` VARCHAR(13) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pembimbing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_ta` INTEGER NULL,
    `id_dosen` INTEGER NULL,
    `status_pbb` ENUM('Aktif', 'Non-Aktif') NULL,

    INDEX `id_dosen`(`id_dosen`),
    INDEX `id_ta`(`id_ta`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pembimbing` ADD CONSTRAINT `pembimbing_ibfk_1` FOREIGN KEY (`id_ta`) REFERENCES `ta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pembimbing` ADD CONSTRAINT `pembimbing_ibfk_2` FOREIGN KEY (`id_dosen`) REFERENCES `dosen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
