# backend

A project created with FastAPI CLI.

## Quick Start

### Start the development server

```bash
uv run fastapi dev
```

Visit http://localhost:8000

## Cookies de sessao

A sessao fica em cookies `HttpOnly` (`access_token` e `refresh_token`), entao
JavaScript nao tem acesso a eles.

O par `AUTH_COOKIE_SAMESITE` / `AUTH_COOKIE_SECURE` precisa combinar com o
ambiente, porque o navegador recusa cookies invalidos em silencio:

| Ambiente | `AUTH_COOKIE_SAMESITE` | `AUTH_COOKIE_SECURE` |
| --- | --- | --- |
| Dev (`localhost:8000` + `localhost:5173`) | `lax` | `false` |
| Producao (API e frontend em dominios diferentes) | `none` | `true` |

Em dev `lax` basta: portas diferentes ainda sao o mesmo site. Em producao com
dominios diferentes, `SameSite=None` sem HTTPS e descartado pelo navegador, e o
login "nao funciona sem erro". Por isso `none` exige `secure=true` — a
aplicacao falha no boot se a combinacao for invalida.

A sessao e renovada em `/auth/refresh`, que le o `refresh_token` do cookie e
reemite os dois. Chame esse endpoint antes de o `access_token` expirar (1h) para
o usuario nao ser deslogado durante a navegacao.

### Pendencia conhecida

O `/auth/logout` hoje so limpa os cookies: nao invalida o token no provedor. Um
`refresh_token` copiado continua valido ate expirar. Revogacao real exige `SUPABASE_SERVICE_ROLE_KEY` e o uso da API admin no backend. Ver `docs/backlog.md`.

### Deploy to FastAPI Cloud

Sign up and log in at https://fastapicloud.com, then deploy with:

```bash
uv run fastapi deploy
```

## Project Structure

- `main.py` - Your FastAPI application
- `pyproject.toml` - Project dependencies

## Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [FastAPI Cloud](https://fastapicloud.com)
