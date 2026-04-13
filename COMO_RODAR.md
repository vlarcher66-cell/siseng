# SIS OBRAS — Como Rodar

## Pré-requisitos
- Node.js 18+ instalado
- MySQL 8+ instalado e rodando

## 1. Configurar banco de dados

```bash
cd backend
cp .env.example .env
# Edite .env com suas credenciais MySQL
```

## 2. Instalar dependências

```bash
cd backend
npm install
```

## 3. Criar tabelas + dados iniciais

```bash
npm run db:migrate   # cria todas as tabelas
npm run db:seed      # insere planos e usuário demo
```

## 4. Iniciar o servidor

```bash
npm run dev          # modo desenvolvimento (com nodemon)
# ou
npm start            # modo produção
```

## 5. Acessar

Abra no navegador: **http://localhost:3000**

## Usuário demo (após seed)
- E-mail: `demo@sisobras.com.br`
- Senha:  `demo1234`
