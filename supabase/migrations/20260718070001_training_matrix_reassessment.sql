-- Map legacy expired cells to the new reassessment status
-- Runs in a separate migration so the new enum values are committed first.
update training_matrix_entries
set status = 'NEEDS_REASSESSMENT'
where status = 'EXPIRED'
  and deleted_at is null;
