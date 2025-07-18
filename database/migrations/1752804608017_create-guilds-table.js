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
		CREATE TABLE public.guilds (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            name character varying(255) NOT NULL,
            slug character varying(255) NOT NULL,
            created_at timestamp with time zone NULL DEFAULT now(),
            CONSTRAINT guilds_pkey PRIMARY KEY (id),
            CONSTRAINT guilds_slug_key UNIQUE (slug)
        );

        ALTER TABLE public.users
        ADD COLUMN guild_id uuid NULL;

        ALTER TABLE public.users
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
