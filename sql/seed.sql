-- Seed data for bib rooms (matches prisma/seed.ts)

INSERT INTO "Room" ("id", "code", "name", "building", "createdAt")
VALUES
    ('room_r101', 'R101', 'Raum 101', 'Hauptgebäude', CURRENT_TIMESTAMP),
    ('room_r204', 'R204', 'Raum 204', 'Hauptgebäude', CURRENT_TIMESTAMP),
    ('room_info1', 'INFO1', 'Informatikraum 1', 'Naturwissenschaften', CURRENT_TIMESTAMP),
    ('room_aula', 'AULA', 'Aula', 'Hauptgebäude', CURRENT_TIMESTAMP),
    ('room_bib', 'BIB', 'Bibliothek', 'Nebengebäude', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Category" ("id", "name", "createdAt")
VALUES
    ('cat_beamer', 'Beamer / Display', CURRENT_TIMESTAMP),
    ('cat_wlan', 'WLAN / Netzwerk', CURRENT_TIMESTAMP),
    ('cat_pc', 'PC / Laptop / iPad', CURRENT_TIMESTAMP),
    ('cat_ton', 'Ton / Kabel', CURRENT_TIMESTAMP),
    ('cat_ipad_pw', 'iPad Passwort vergessen', CURRENT_TIMESTAMP),
    ('cat_sonstiges', 'Sonstiges', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "StatusOption" ("id", "key", "label", "color", "createdAt")
VALUES
    ('status_open', 'OPEN', 'Offen', 'zinc', CURRENT_TIMESTAMP),
    ('status_in_progress', 'IN_PROGRESS', 'In Bearbeitung', 'amber', CURRENT_TIMESTAMP),
    ('status_resolved', 'RESOLVED', 'Gelöst', 'emerald', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
