-- 006_fix_print_jobs_saleid_null.sql
-- Make saleId nullable since quotation print jobs don't have a saleId

ALTER TABLE `print_jobs` MODIFY COLUMN `saleId` INT DEFAULT NULL;
