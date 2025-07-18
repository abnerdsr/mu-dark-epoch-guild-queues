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
		ALTER TABLE public.queues
        ADD COLUMN guild_id uuid NULL;

        ALTER TABLE public.queues
        ADD CONSTRAINT fk_guild
        FOREIGN KEY (guild_id)
        REFERENCES public.guilds (id)
        ON DELETE SET NULL;

        ALTER TABLE public.queue_items
        ADD COLUMN guild_id uuid NULL;

        ALTER TABLE public.queue_items
        ADD CONSTRAINT fk_guild
        FOREIGN KEY (guild_id)
        REFERENCES public.guilds (id)
        ON DELETE SET NULL;

        ALTER TABLE public.drop_events
        ADD COLUMN guild_id uuid NULL;

        ALTER TABLE public.drop_events
        ADD CONSTRAINT fk_guild
        FOREIGN KEY (guild_id)
        REFERENCES public.guilds (id)
        ON DELETE SET NULL;

        ALTER TABLE public.drop_participants
        ADD COLUMN guild_id uuid NULL;

        ALTER TABLE public.drop_participants
        ADD CONSTRAINT fk_guild
        FOREIGN KEY (guild_id)
        REFERENCES public.guilds (id)
        ON DELETE SET NULL;
	`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {};
