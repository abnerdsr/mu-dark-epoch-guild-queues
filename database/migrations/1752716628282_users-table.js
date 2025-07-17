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
		CREATE TABLE public.users (
			id uuid NOT NULL DEFAULT gen_random_uuid(),
			username character varying(50) NOT NULL,
			name character varying(255) NOT NULL,
			password character varying(255) NOT NULL,
			role character varying(20) NULL DEFAULT 'user'::character varying,
			created_at timestamp with time zone NULL DEFAULT now(),
			CONSTRAINT users_pkey PRIMARY KEY (id),
			CONSTRAINT users_username_key UNIQUE (username),
			CONSTRAINT users_role_check CHECK (
				((role)::text = ANY (
					ARRAY[
						('master'::character varying)::text,
						('user'::character varying)::text
					]
				))
			)
		);
	`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {};
