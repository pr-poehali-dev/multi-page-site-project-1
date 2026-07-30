INSERT INTO t_p73771717_multi_page_site_proj.jury_sessions (jury_member_id, session_token, expires_at)
VALUES (3, 'test_flow_verification_token_12345', NOW() + INTERVAL '1 hour')
ON CONFLICT (session_token) DO NOTHING;