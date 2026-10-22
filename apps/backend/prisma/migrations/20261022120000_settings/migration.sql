-- Application settings as a JSON-encoded key/value store: one table for every
-- setting there will ever be, rather than a migration per setting. Today that is
-- the default model and which providers are enabled. SettingsService is the only
-- reader and writer, and the one that knows each value's type.
CREATE TABLE "setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL
);
