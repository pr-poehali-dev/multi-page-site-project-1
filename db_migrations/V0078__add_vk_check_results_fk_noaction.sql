ALTER TABLE t_p73771717_multi_page_site_proj.vk_check_results
    ADD CONSTRAINT vk_check_results_application_id_fkey
        FOREIGN KEY (application_id) REFERENCES t_p73771717_multi_page_site_proj.applications(id);