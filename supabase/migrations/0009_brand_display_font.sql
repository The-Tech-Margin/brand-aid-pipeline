-- Per-user decorative display font (a Google Fonts family name) for the brand. Drives
-- --font-display (header / footer / hero). Optional; null falls back to the built-in
-- decorative font. The admin-set global brand stores it in app_settings.global_brand.
alter table brand_helper.brand_profiles
  add column if not exists display_font text;
