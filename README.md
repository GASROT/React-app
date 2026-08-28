# AgroShop Mobile

Aplicativo Expo/React Native do AgroShop.

Este app deve ser executado fora do Docker para reduzir consumo de memoria do WSL/Docker Desktop. O Docker do projeto fica reservado para `backend` e `postgres`.

## Antes de iniciar

Suba a API e o banco pela raiz do projeto:

```bash
docker compose up --build
```

Confirme que a API respondeu:

```bash
curl http://localhost:3000/api/v1/health
```

## Rodar o app

Instale as dependencias:

```bash
npm install
```

Inicie no navegador:

```bash
npm run web
```

Ou inicie o Expo para usar Android/iOS:

```bash
npm start
```

## API

No navegador, o app usa:

```txt
http://localhost:3000/api/v1
```

## Login demo

A rota `/login` autentica contra `POST /api/v1/auth/login`.

| Perfil | E-mail | Senha | Destino |
| --- | --- | --- | --- |
| Cliente | `cliente@agroshop.com.br` | `Cliente@12345` | Loja atual |
| Administrador | `admin@agroshop.com.br` | `Admin@12345` | `/admin/dashboard` |

O dashboard administrativo permite consultar metricas, cadastrar produtos e avancar status de pedidos enviados para a empresa.

Em dispositivo fisico via Expo Go, mantenha o celular na mesma rede do computador. O app detecta o host do Metro/Expo e chama a API na porta `3000`.

## Scripts

- `npm run web`: abre o app no navegador.
- `npm run android`: abre no Android/Expo Go.
- `npm run ios`: abre no iOS.
- `npm run typecheck`: valida TypeScript.
