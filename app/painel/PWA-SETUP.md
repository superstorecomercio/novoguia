# Configuração PWA - MudaTech

## O que foi implementado

### 1. Manifest (manifest.json)
- Nome do app: "MudaTech Dashboard"
- Modo: standalone (funciona como app nativo)
- Tema: azul (#2563eb)
- Ícones: 192x192 e 512x512
- Atalhos: Dashboard e Perfil
- Screenshots para lojas de apps

### 2. Service Worker (sw.js)
- Cache de recursos estáticos
- Funcionamento offline básico
- Estratégia: Cache First, depois Network
- Atualização automática de cache

### 3. Componente de Instalação (InstallPrompt)
- Prompt personalizado para instalar
- Aparece após 3 segundos no dashboard
- Pode ser dispensado (salva preferência)
- Detecta se já foi instalado

### 4. Metadata PWA no Layout
- Theme color para barra de status
- Apple Web App capable
- Viewport otimizado para mobile
- Lang pt-BR

### 5. Ícones e Assets
- Ícone 192x192 (Android)
- Ícone 512x512 (Android splash)
- Apple icon 180x180 (iOS)
- Screenshots mobile e desktop
- Página offline

## Como testar localmente

1. Build do projeto:
\`\`\`bash
npm run build
npm start
\`\`\`

2. Acesse via HTTPS ou localhost

3. Abra DevTools > Application > Manifest
   - Verifique se o manifest está carregado
   - Teste o botão "Install"

4. Teste o Service Worker:
   - DevTools > Application > Service Workers
   - Marque "Offline" para testar cache

## Como instalar no celular

### Android (Chrome)
1. Acesse o site
2. Toque no menu (⋮) > "Instalar app" ou "Adicionar à tela inicial"
3. Confirme a instalação

### iOS (Safari)
1. Acesse o site
2. Toque no botão de compartilhar (⬆️)
3. "Adicionar à Tela de Início"
4. Confirme

## Recursos PWA implementados

✅ Instalável (Add to Home Screen)
✅ Ícones personalizados
✅ Splash screen automático
✅ Standalone mode (sem barra do navegador)
✅ Service Worker para cache
✅ Funcionamento offline básico
✅ Prompt de instalação customizado
✅ Theme color para barra de status
✅ Atalhos de app (shortcuts)
✅ Responsivo mobile-first

## Próximos passos (opcional)

- [ ] Sync de dados offline com Supabase
- [ ] Notificações push
- [ ] Background sync para propostas
- [ ] Cache de imagens de leads
- [ ] Estratégia de cache mais sofisticada
