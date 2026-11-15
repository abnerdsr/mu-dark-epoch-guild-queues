import { z } from "zod";

export const usernameSchema = z
  .string({ error: "Username é obrigatório" })
  .trim()
  .min(1, "Username é obrigatório")
  .max(50, "Username muito longo (máx. 50)")
  .refine((value) => !/\s/.test(value), "Username não pode conter espaços");

export const nameSchema = z
  .string({ error: "Nome é obrigatório" })
  .trim()
  .min(1, "Nome é obrigatório")
  .max(255, "Nome muito longo");

/** Regras para senhas NOVAS (login aceita qualquer senha antiga). */
export const newPasswordSchema = z
  .string({ error: "Senha é obrigatória" })
  .min(6, "A senha precisa ter pelo menos 6 caracteres")
  .max(200, "Senha muito longa");

export const idSchema = z.string().uuid("Id inválido");

export const roleSchema = z.enum(["master", "user"]);

export const queueTitleSchema = z.string().trim().min(1, "Título é obrigatório").max(255, "Título muito longo");
