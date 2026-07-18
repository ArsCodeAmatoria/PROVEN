-- Training matrix cell statuses: Verified + Needs Reassessment
-- Enum ADD VALUE cannot be used in the same transaction as UPDATE with the new value.
alter type "TrainingMatrixCellStatus" add value if not exists 'VERIFIED';
alter type "TrainingMatrixCellStatus" add value if not exists 'NEEDS_REASSESSMENT';
