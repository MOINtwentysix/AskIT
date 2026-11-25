-- Seed data for bib rooms (matches prisma/seed.ts)

INSERT INTO "Room" ("id", "code", "name", "building", "createdAt")
VALUES
    ('room_r101', 'R101', 'Raum 101', 'Hauptgebäude', CURRENT_TIMESTAMP),
    ('room_r204', 'R204', 'Raum 204', 'Hauptgebäude', CURRENT_TIMESTAMP),
    ('room_info1', 'INFO1', 'Informatikraum 1', 'Naturwissenschaften', CURRENT_TIMESTAMP),
    ('room_aula', 'AULA', 'Aula', 'Hauptgebäude', CURRENT_TIMESTAMP),
    ('room_bib', 'BIB', 'Bibliothek', 'Nebengebäude', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
