-- Номинации конкурса (создаются отдельно для каждого конкурса)
CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.nominations (
    id SERIAL PRIMARY KEY,
    contest_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nominations_contest ON t_p73771717_multi_page_site_proj.nominations(contest_id);

-- Критерии оценивания внутри номинации (название + максимальный балл)
CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.nomination_criteria (
    id SERIAL PRIMARY KEY,
    nomination_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.nominations(id),
    name TEXT NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 10,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nomination_criteria_nomination ON t_p73771717_multi_page_site_proj.nomination_criteria(nomination_id);

-- Привязка участника программы к конкретной номинации (со своими критериями)
ALTER TABLE t_p73771717_multi_page_site_proj.contest_program
    ADD COLUMN IF NOT EXISTS nomination_id INTEGER REFERENCES t_p73771717_multi_page_site_proj.nominations(id);

-- Оценки судей по каждому критерию для каждого участника
CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.program_criteria_scores (
    id SERIAL PRIMARY KEY,
    program_row_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.contest_program(id),
    jury_member_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.jury_members(id),
    criterion_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.nomination_criteria(id),
    contest_id INTEGER NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    comment TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(program_row_id, jury_member_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_program_criteria_scores_row ON t_p73771717_multi_page_site_proj.program_criteria_scores(program_row_id);
CREATE INDEX IF NOT EXISTS idx_program_criteria_scores_contest ON t_p73771717_multi_page_site_proj.program_criteria_scores(contest_id);
