// Tipos compartilhados entre as rotas de servidor (app/api) e o cliente.

export type Role = "master" | "user";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  mustChangePassword: boolean;
}

/** Usuário como aparece na lista pública (username só é enviado para masters). */
export interface ListedUser {
  id: string;
  name: string;
  username: string;
  role: Role;
}

export type QueueItemStatus = "waiting" | "approved" | "completed";

export interface QueueWithItems {
  id: string;
  title: string;
  item_name: string;
  image_url?: string;
  items: Array<{
    id: string;
    name: string;
    position: number;
    status: QueueItemStatus;
    requestedBy: string;
  }>;
}
