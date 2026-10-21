<div align="center">

# 📜 BrainPG

### *O grimório digital do Mestre de RPG*

**Organize campanhas, conecte ideias e desvende mistérios — tudo em um só lugar.**

[![Acessar o App](https://img.shields.io/badge/🎲_Acessar_o_App-mindforge--questforge-d4a017?style=for-the-badge)](https://mindforge-questforge.lovable.app)

![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![React Flow](https://img.shields.io/badge/React_Flow-FF0072?style=flat-square)

</div>

---

## ✨ O que é o BrainPG?

O **BrainPG** é uma central de gestão de campanhas de RPG de mesa feita para Mestres. Em vez de cadernos espalhados, planilhas e post-its, você tem um painel com tema de fantasia sombria onde cada NPC, local, facção, missão e sessão vive conectado à sua campanha.

> 🧙 *"Lembra daquele taverneiro da sessão 3 que sabia sobre o culto?"* — Agora você lembra.

---

## 🗺️ Funcionalidades

| Módulo | O que faz |
|---|---|
| 📜 **Campanhas** | Crie e gerencie várias campanhas, com sistema de regras, status e capa. Tudo no app gira em torno da campanha ativa. |
| 🧠 **Mapa Mental** | Quadro visual infinito para conectar ideias, personagens e eventos da trama. |
| 🔍 **Investigação** | Quadro de cortiça estilo "detetive" com pistas e fios coloridos ligando evidências. |
| 👤 **NPCs** | Fichas de personagens com retrato, descrição e detalhes. |
| 📍 **Locais** | Catálogo de cidades, masmorras e regiões com imagens. |
| 🏴 **Facções** | Guildas, cultos e reinos com seus objetivos e brasões. |
| ⚔️ **Missões** | Acompanhe missões principais e secundárias e seu progresso. |
| 📅 **Sessões** | Registro de cada sessão de jogo: data, resumo e anotações. |
| ⏰ **Linha do Tempo** | Cronologia dos acontecimentos do mundo da campanha. |
| 📂 **Biblioteca** | Arquivos organizados em pastas: imagens, mapas, tokens, áudios, vídeos e documentos, com favoritos e prévia. |

---

## 🧠 Mapa Mental em detalhe

O coração criativo do BrainPG.

- **7 tipos de nó** — 💡 Ideia · 👤 NPC · 📍 Local · ⚔️ Missão · 🏴 Facção · 📅 Evento · 🎒 Item
- **6 tipos de conexão** — Padrão · Causa · Leva a · Relacionado · Opõe · Apoia (com rótulos personalizados)
- **Painel de Conexões** lateral para editar ou excluir qualquer ligação
- **Importar entidades** — traga NPCs, Locais e Missões já cadastrados como nós
- **Importar / Exportar JSON** com prévia, validação e organização automática em grade
- **Exportar PNG** em alta resolução (1x, 2x, 3x)
- **Posições salvas automaticamente** ao arrastar
- **Mini-mapa** e controles de zoom

### ⌨️ Atalhos

| Atalho | Ação |
|---|---|
| `Shift + Clique` | Selecionar vários nós |
| `Ctrl + C` / `Ctrl + V` | Copiar / colar nós |
| `Ctrl + D` | Duplicar seleção |
| `Ctrl + Z` | Desfazer última ação |
| `Delete` | Excluir seleção |
| `Esc` | Limpar seleção |
| `Clique direito` | Menu de contexto |

### 📄 Modelo de importação JSON

```json
{
  "nodes": [
    { "ref": "rei", "title": "Rei Aldric", "nodeType": "npc" },
    { "ref": "castelo", "title": "Castelo Negro", "nodeType": "location" }
  ],
  "connections": [
    { "source": "rei", "target": "castelo", "label": "Governa", "connectionType": "related" }
  ]
}
```

---

## 🔍 Quadro de Investigação

Para campanhas de mistério e horror investigativo:

- Pistas por tipo: 🔍 Evidência · 👤 Pessoa · 📍 Local · 📄 Documento · 💡 Teoria · ⏰ Cronologia · ❓ Desconhecido
- Fios coloridos (vermelho, laranja, verde, azul, roxo, branco) ligando pistas
- Imagens anexadas e pistas fixadas no quadro
- Vários quadros por campanha

---

## 🎨 Visual e experiência

- 🌑 **Tema escuro de fantasia** com detalhes dourados e tipografia temática
- 📱 **Funciona no celular**, tablet e computador
- 🖼️ **Envio de imagens** por arrastar e soltar em NPCs, Locais, Facções e Pistas
- 🔐 **Login com conta pessoal** — seus dados ficam só com você

---

## 🛠️ Tecnologias

- **React 18 + TypeScript + Vite** — base do app
- **Tailwind CSS + shadcn/ui** — interface e componentes
- **React Flow** (`@xyflow/react`) — Mapa Mental e Quadro de Investigação
- **TanStack Query** — carregamento e cache de dados
- **Zod + React Hook Form** — formulários e validação
- **Lovable Cloud** — autenticação, banco de dados e armazenamento de arquivos

---

## 🚀 Rodando localmente

Requisito: [Node.js](https://nodejs.org) instalado.

```sh
git clone <URL_DO_REPOSITORIO>
cd brainpg
npm install
npm run dev
```

O app abre em `http://localhost:8080`.

| Comando | Função |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera a versão de produção |
| `npm run test` | Roda os testes |
| `npm run lint` | Verifica o código |

---

## 📁 Estrutura

```text
src/
├── pages/            # Telas: Campanhas, NPCs, Mapa Mental, Investigação...
├── components/
│   ├── mindmap/      # Nós, conexões, importação/exportação
│   ├── investigation/# Pistas, fios e quadro
│   ├── resources/    # Biblioteca de arquivos e pastas
│   ├── layout/       # Menu lateral e estrutura
│   └── ui/           # Componentes base
├── contexts/         # Login e campanha ativa
├── hooks/            # Lógica de dados (campanhas, upload, desfazer)
└── integrations/     # Conexão com o backend
```

---

<div align="center">

**Feito com 🎲 e ☕ para Mestres que querem lembrar de tudo.**

*Que seus dados rolem 20 naturais.*

</div>
