# Frontend

SPA React + TypeScript + Vite do Bonfire.

## Comandos

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build (build também valida os tipos)
npm run lint
npm run preview
```

## Stack

| Ferramenta | Versão | Papel |
| --- | --- | --- |
| React | 19 | biblioteca de UI |
| Vite | 8 | build e dev server |
| TypeScript | 6 | tipos (com `strict`) |
| Tailwind CSS | 4 | estilos, configurado via plugin do Vite e `@import "tailwindcss"` — sem `tailwind.config.js` |
| shadcn/ui | 4 | componentes em `src/components/ui`, copiados para o repositório |
| react-router | 7 | rotas |
| react-hook-form + zod | 7 / 4 | formulários e validação |

## Estrutura

```
src/
├── components/
│   ├── ui/          # shadcn — não editar à mão, regerar com `npx shadcn add <componente>`
│   └── ...          # componentes próprios (ex.: ProtectedRoute)
├── contexts/        # contextos React (ex.: AuthContext)
├── lib/             # api.ts (client HTTP) e utils.ts
├── pages/           # uma pasta por tela; uma página por arquivo
├── types/           # tipos compartilhados
├── router.tsx       # tabela de rotas (createBrowserRouter)
├── App.tsx          # layout raiz, renderiza <Outlet />
└── main.tsx         # ponto de entrada, com o RouterProvider
```

## Rotas (data mode)

O roteamento usa **data mode** (`createBrowserRouter`). A tabela de rotas fica em
`src/router.tsx`; `App.tsx` é o layout raiz e renderiza `<Outlet />`.

Para adicionar uma tela, crie `src/pages/<Tela>Page.tsx` e registre a rota em
`src/router.tsx`:

```tsx
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'cadastro', element: <CadastroPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
```

Padrões que já valem para as próximas telas:

- **Importar de `react-router`**, nunca de `react-router-dom`. No v7 o
  `react-router-dom` foi absorvido pelo `react-router` e o pacote separado não
  recebe mais releases.
- **Erro unexpected** cai no `errorElement` da rota (`src/pages/ErrorPage.tsx`),
  que usa `useRouteError` + `isRouteErrorResponse`. Uma tela que lança na
  renderização não derruba a aplicação.
- **Rotas protegidas** entram como `loader` da rota, com `throw redirect(...)`
  quando não há sessão. O `ErrorPage`/`NotFoundPage` não devem ser usados para
  isso — o `loader` redireciona antes da renderização.
- **Dados da rota** são lidos com `useLoaderData()` dentro da página.

## Convenções

- **Importações** pelo alias `@/` (aponta para `src/`), configurado em `vite.config.ts` e nos dois `tsconfig.json`.
- **Estilos** só por classes do Tailwind. A paleta é monocromática: use `neutral-*` e as variáveis do shadcn. A única cor é `--destructive` (vermelho), reservada para mensagens de erro.
- **Ícones** via `tabler`, que é o que o `components.json` declara.
- **Aspas simples e sem ponto e vírgula**, seguindo o padrão do resto do repositório. Os arquivos de `components/ui` mantêm o formato que o shadcn gera, para não gerar atrito em futuros `npx shadcn add`.
- **Dark mode** não está habilitado. O `@custom-variant dark` existe no `index.css` de propósito: sem ele, o Tailwind v4 faz as classes `dark:` responderem ao tema do sistema operacional em vez de ficarem inertes.

## Adicionar um componente do shadcn

```bash
npx shadcn@latest add <componente>
```

## Backend

O `VITE_API_URL` aponta para a base do backend FastAPI — **sem** `/api`, que é a
origem de um bug fácil de esquecer. O backend registra as rotas na raiz
(`APIRouter(prefix="/auth")` sem prefixo global), então os caminhos reais são
`/auth/register`, `/auth/login`, `/auth/me` e `/auth/logout`.

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

A autenticação usa cookies `HttpOnly`, então toda requisição precisa de `credentials: 'include'` e o front-end nunca lê o token diretamente.