-- Seed system Tower Crane Rigger curriculum + module exams (platform templates)

insert into curricula (company_id, code, title, description, is_active, sort_order)
select
  null,
  'TOWER_CRANE_RIGGER',
  'Tower Crane Rigger',
  'Official learning pathway for tower crane rigger education — lessons, progress, and written examinations.',
  true,
  0
where not exists (
  select 1 from curricula where code = 'TOWER_CRANE_RIGGER' and company_id is null
);

insert into curriculum_modules (curriculum_id, code, title, description, sort_order)
select c.id, v.code, v.title, v.description, v.sort_order
from curricula c
cross join (
  values
    ('BASIC_KNOWLEDGE', 'Basic Knowledge of Crane Operations', 'Responsibilities, terminology, signals, hazards, capacity, and safe work.', 1),
    ('RIGGING_TERMINOLOGY', 'Rigging Terminology', 'Slings, hardware, hooks, below-the-hook devices, WLL, and hitch configurations.', 2),
    ('COMMUNICATION', 'Communication', 'Jobsite hazards, visibility, hand/radio signals, and communication barriers.', 3),
    ('SAFETY_STANDARDS', 'Safety Standards and Regulations', 'OHS, WorkSafeBC, ASME B30, inspections, and refusal of unsafe work.', 4),
    ('PLANNING', 'Planning the Rigging Activity', 'Lift planning, load weight, travel path, critical lifts, and engineered plans.', 5),
    ('EXECUTION', 'Execution of Rigging Activity', 'Inspections, sling use, tag lines, landing loads, and unsafe rigging.', 6)
) as v(code, title, description, sort_order)
where c.code = 'TOWER_CRANE_RIGGER' and c.company_id is null
on conflict (curriculum_id, code) do nothing;

insert into curriculum_lessons (module_id, content_key, title, sort_order)
select m.id, v.content_key, v.title, v.sort_order
from curriculum_modules m
join curricula c on c.id = m.curriculum_id
join (
  values
    ('BASIC_KNOWLEDGE', 'overview', 'Course overview', 1),
    ('BASIC_KNOWLEDGE', 'module-4', 'Crane awareness', 2),
    ('BASIC_KNOWLEDGE', 'module-13', 'Crane physics for riggers', 3),
    ('BASIC_KNOWLEDGE', 'module-14', 'Environmental and site hazards', 4),
    ('BASIC_KNOWLEDGE', 'module-17', 'Safety culture and human factors', 5),
    ('BASIC_KNOWLEDGE', 'appendix-d', 'Crane types — operational characteristics', 6),
    ('RIGGING_TERMINOLOGY', 'module-2', 'Rigging equipment', 1),
    ('RIGGING_TERMINOLOGY', 'module-8', 'Advanced sling geometry', 2),
    ('RIGGING_TERMINOLOGY', 'module-10', 'Chainfalls and lever hoists', 3),
    ('RIGGING_TERMINOLOGY', 'module-12', 'Specialty lifting devices', 4),
    ('RIGGING_TERMINOLOGY', 'module-19', 'Glossary — crane and rigging terms', 5),
    ('RIGGING_TERMINOLOGY', 'appendix-c', 'Rigging equipment identification', 6),
    ('COMMUNICATION', 'module-7', 'Communication', 1),
    ('COMMUNICATION', 'appendix-a', 'Standard hand signals', 2),
    ('SAFETY_STANDARDS', 'module-1', 'Regulations, standards and responsibilities', 1),
    ('SAFETY_STANDARDS', 'module-3', 'Inspection', 2),
    ('SAFETY_STANDARDS', 'appendix-e', 'BC regulations and standards quick reference', 3),
    ('PLANNING', 'module-6', 'Basic rigging math', 1),
    ('PLANNING', 'module-11', 'Multiple crane / tandem lifts', 2),
    ('PLANNING', 'module-15', 'Lift planning and critical lifts', 3),
    ('PLANNING', 'module-23', 'Heavy lift engineering', 4),
    ('PLANNING', 'appendix-b', 'Basic rigging math reference', 5),
    ('EXECUTION', 'module-5', 'Basic practices', 1),
    ('EXECUTION', 'module-9', 'Advanced load control', 2),
    ('EXECUTION', 'module-16', 'Practical rigging field operations', 3),
    ('EXECUTION', 'module-18', 'Reference tables and field guidelines', 4),
    ('EXECUTION', 'module-20', 'Final integration — applied readiness', 5),
    ('EXECUTION', 'module-21', 'Knots, hitches, and rope applications', 6),
    ('EXECUTION', 'module-22', 'Block, tackle, reeving, mechanical advantage', 7),
    ('EXECUTION', 'module-24', 'Tower crane rigging operations', 8),
    ('EXECUTION', 'module-25', 'Incident case studies and failure analysis', 9)
) as v(module_code, content_key, title, sort_order) on v.module_code = m.code
where c.code = 'TOWER_CRANE_RIGGER' and c.company_id is null
on conflict (module_id, content_key) do nothing;

insert into written_exams (company_id, code, title, description, status, passing_score, time_limit_min, version)
select null, 'PULL-' || m.code, m.title || ' — Official Examination',
       'Official written assessment for curriculum module: ' || m.title, 'PUBLISHED', 70, 60, 1
from curriculum_modules m
join curricula c on c.id = m.curriculum_id
where c.code = 'TOWER_CRANE_RIGGER' and c.company_id is null
  and not exists (
    select 1 from written_exams we
    where we.code = 'PULL-' || m.code and we.company_id is null
  );

insert into curriculum_module_exams (module_id, exam_id, sort_order)
select m.id, we.id, 0
from curriculum_modules m
join curricula c on c.id = m.curriculum_id
join written_exams we on we.code = 'PULL-' || m.code and we.company_id is null
where c.code = 'TOWER_CRANE_RIGGER' and c.company_id is null
on conflict (module_id, exam_id) do nothing;
