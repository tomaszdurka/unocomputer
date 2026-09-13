-- MikroORM declared run.output_schema, run.result and run_event.payload as `json`.
-- SQLite has no JSON type, so those columns already hold plain JSON text - but Prisma's
-- SQLite connector refuses to read a column whose DECLARED type is `json`, failing with
-- "Conversion failed: Value json not supported" no matter what schema.prisma says.
--
-- SQLite cannot ALTER a column's type, so each affected table is rebuilt: create the
-- table with `text` in place of `json`, copy every row across, drop the original and
-- rename. Column order and every other type, constraint and index is preserved exactly,
-- so the only change is the declared type of three columns. No value is rewritten.

PRAGMA foreign_keys=OFF;

CREATE TABLE `run_new` (
  `run_id` text not null,
  `prompt` text not null,
  `output_schema` text null,
  `status` text check (`status` in ('running', 'success', 'failure', 'stopped')) not null,
  `result` text null,
  `exit_code` integer null,
  `started_at` datetime not null,
  `completed_at` datetime null,
  `last_heartbeat` datetime null,
  `session_session_id` text not null,
  `workspace_workspace_id` text not null,
  `model` text null,
  constraint `run_session_session_id_foreign` foreign key(`session_session_id`) references `session`(`session_id`) on update cascade,
  constraint `run_workspace_workspace_id_foreign` foreign key(`workspace_workspace_id`) references `workspace`(`workspace_id`) on update cascade,
  primary key (`run_id`)
);
INSERT INTO `run_new` SELECT * FROM `run`;
DROP TABLE `run`;
ALTER TABLE `run_new` RENAME TO `run`;
CREATE INDEX `run_session_session_id_index` on `run` (`session_session_id`);
CREATE INDEX `run_workspace_workspace_id_index` on `run` (`workspace_workspace_id`);

CREATE TABLE `run_event_new` (
  `id` text not null,
  `type` text not null,
  `payload` text not null,
  `sequence` integer not null,
  `created_at` datetime not null,
  `run_run_id` text not null,
  constraint `run_event_run_run_id_foreign` foreign key(`run_run_id`) references `run`(`run_id`) on update cascade,
  primary key (`id`)
);
INSERT INTO `run_event_new` SELECT * FROM `run_event`;
DROP TABLE `run_event`;
ALTER TABLE `run_event_new` RENAME TO `run_event`;
CREATE INDEX `run_event_run_run_id_index` on `run_event` (`run_run_id`);

PRAGMA foreign_keys=ON;
