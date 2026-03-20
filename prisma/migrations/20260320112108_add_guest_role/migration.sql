-- AlterEnum
-- PostgreSQL requires ALTER TYPE ... ADD VALUE to commit before the new value
-- can be used. This is handled by running it outside a transaction block.
ALTER TYPE "Role" ADD VALUE 'GUEST';