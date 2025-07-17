/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.sql(`
        create table public.drop_participants (
            id uuid not null default gen_random_uuid (),
            drop_event_id uuid null,
            queue_item_id uuid null,
            name text not null,
            action text null,
            created_at timestamp with time zone null default now(),
            constraint drop_participants_pkey primary key (id),
            constraint drop_participants_drop_event_id_fkey foreign KEY (drop_event_id) references drop_events (id) on delete CASCADE,
            constraint drop_participants_queue_item_id_fkey foreign KEY (queue_item_id) references queue_items (id) on delete CASCADE,
            constraint drop_participants_action_check check (
                (
                action = any (
                    array['accept'::text, 'skip'::text, 'decline'::text]
                )
                )
            )
        );

        create index IF not exists idx_drop_participants_drop_event_id on public.drop_participants using btree (drop_event_id);

        create index IF not exists idx_drop_participants_queue_item_id on public.drop_participants using btree (queue_item_id);
    `)
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {};
