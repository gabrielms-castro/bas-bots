# BAS Bots

### 1) Instale o Bun

``` bash
# Linux & macOS
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
```

### 2) Instale as dependências 
```sh
bun install
```

### 3) Instale o SQLite3 (provisório)
```sh
# linux
sudo apt update
sudo apt install sqlite3
```

### 4) Inicie o server
```sh
bun run src/index.ts
```

## Features
* Execução de bots via API se necessário
* Controle de credenciais a serem usadas pelos bots definidos e vinculados por usuário

## Dependencias Necessários no OS
- curl
- unrar