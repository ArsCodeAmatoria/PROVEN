-- Training matrix cell statuses: Verified + Needs Reassessment
alter type "TrainingMatrixCellStatus" add value if not exists 'VERIFIED';
alter type "TrainingMatrixCellStatus" add value if not exists 'NEEDS_REASSESSMENT';

-- Map legacy expired cells to the new reassessment status
update training_matrix_entries
set status = 'NEEDS_REASSESSMENT'
where status = 'EXPIRED'
  and deleted_at is null;
