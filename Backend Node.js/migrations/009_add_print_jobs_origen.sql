ALTER TABLE print_jobs ADD COLUMN origen ENUM('auto','reprint') NOT NULL DEFAULT 'auto' AFTER id;
