# Sistema de controle de filas para loot de boses

### Instalação local

copie o .env de exemplo e preencha com os dados do seu supabase free, https://supabase.com
```sh
cp .example.env .env
```

instale o projeto com o pnpm
```
pnpm i
```

rode as migrations para criar as tabelas no banco de dados
```
pnpm run migrate:up
```

rode o projeto localmente
```
pnpm run dev
```

### Links uteis
- https://supabase.com
- https://pnpm.io/installation
- https://salsita.github.io/node-pg-migrate/getting-started
