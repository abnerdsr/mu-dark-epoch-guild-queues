// Identificador do build atual, definido em next.config.mjs e embutido tanto no
// bundle do navegador quanto no servidor. Muda a cada deploy.
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
