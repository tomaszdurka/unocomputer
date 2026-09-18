-- Tags on a run: a JSON array of labels the caller attaches, so an app can ask
-- "do I already have a run of this kind in flight?" without tracking run ids.
ALTER TABLE "run" ADD COLUMN "tags" TEXT NOT NULL DEFAULT '[]';
