-- Migration 001: Create warranty_records table
-- Matches the approved schema: Phase 1 (Claim Registration) + Phase 2 (Analysis)
-- fields, workflow status, optimistic-locking version, soft delete via
-- deleted_at, and audit timestamps. No trigger — version/updated_at are set
-- explicitly by repository update statements.

CREATE TABLE IF NOT EXISTS warranty_records (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,

    -- ===== Phase 1: Claim Registration =====
    reporting_month             TEXT NOT NULL,
    memo_no                     TEXT NOT NULL,
    memo_date                   TEXT NOT NULL,
    customer                    TEXT NOT NULL,
    claim_no                    TEXT NOT NULL,
    claim_failure_date          TEXT NOT NULL,
    claim_failure_month         TEXT,
    dealer_code                 TEXT,
    dealer_name                 TEXT,
    state                       TEXT,
    zone                        TEXT,
    physical_part_number        TEXT,
    invoice_part_number         TEXT,
    switch_name                 TEXT,
    customer_part_number        TEXT,
    vehicle_model                TEXT NOT NULL,
    sub_model                   TEXT,
    chassis_no                  TEXT,
    chassis_month                TEXT,
    km                          INTEGER,
    km_category                 TEXT,
    vehicle_sale_date           TEXT,
    switch_batch_code           TEXT,
    switch_manufacturing_month  TEXT,
    mis                         TEXT,
    quantity                    INTEGER NOT NULL DEFAULT 1,
    complaint_reported          TEXT,
    ji_decision                 TEXT CHECK (ji_decision IN ('Accepted', 'Rejected')),

    -- ===== Phase 2: Analysis =====
    mrpl_end_switch_received    TEXT CHECK (mrpl_end_switch_received IN ('Yes', 'No')),
    part_received_on            TEXT,
    qre_observation              TEXT,
    warranty_cell_observation   TEXT,
    root_cause                  TEXT,
    action                      TEXT,
    cut_off_date                 TEXT,
    final_classification        TEXT CHECK (
        final_classification IN ('Pre', 'Post', 'NTF', 'Tampered', 'Not MRPL Issue')
    ),

    -- ===== Workflow =====
    status TEXT NOT NULL DEFAULT 'Pending Part Receipt' CHECK (
        status IN ('Pending Part Receipt', 'Part Received', 'Under Analysis', 'Completed')
    ),

    -- ===== Concurrency & Soft Delete =====
    version      INTEGER NOT NULL DEFAULT 1,
    deleted_at   TEXT,

    -- ===== Audit =====
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_warranty_customer      ON warranty_records(customer);
CREATE INDEX IF NOT EXISTS idx_warranty_vehicle_model ON warranty_records(vehicle_model);
CREATE INDEX IF NOT EXISTS idx_warranty_batch_code    ON warranty_records(switch_batch_code);
CREATE INDEX IF NOT EXISTS idx_warranty_root_cause    ON warranty_records(root_cause);
CREATE INDEX IF NOT EXISTS idx_warranty_status        ON warranty_records(status);
CREATE INDEX IF NOT EXISTS idx_warranty_reporting_mo  ON warranty_records(reporting_month);
CREATE INDEX IF NOT EXISTS idx_warranty_deleted_at    ON warranty_records(deleted_at);