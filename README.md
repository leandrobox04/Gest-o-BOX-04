# BOX04 Manager

Painel de performance da barbearia.

## Como subir online (Vercel)

1. Crie conta gratuita em https://github.com
2. Clique em "New repository", nomeie `box04-manager`, deixe público, clique "Create"
3. Na página do repositório vazio, clique em "uploading an existing file"
4. Arraste todos os arquivos desta pasta (incluindo `package.json`, `vite.config.js`, `index.html`, e a pasta `src/`)
5. Clique em "Commit changes"
6. Crie conta gratuita em https://vercel.com (entre com a conta do GitHub)
7. Clique em "Add New" → "Project"
8. Selecione o repositório `box04-manager`
9. Clique em "Deploy" — não mude nenhuma configuração
10. Aguarde 1-2 minutos. Pronto, o site estará no ar com URL própria.

## Rodar localmente (opcional)

Se quiser testar antes de subir:

```bash
npm install
npm run dev
```

Abre em http://localhost:5173

## Onde os dados ficam

Os lançamentos ficam salvos no `localStorage` do navegador onde você acessa o site. Significa:
- Lançou do computador da barbearia → dados ficam ali
- Abriu do celular → vai mostrar dados separados (do navegador do celular)

Para sincronizar dados entre dispositivos, é necessário evoluir para um banco real (Supabase é a recomendação).

## Stack

- React 18 + Vite
- Recharts (gráficos)
- Lucide React (ícones)
- localStorage (persistência local)
