# Instruções para Criar Ícones PWA do MudaTech

## Requisitos dos Ícones

O PWA precisa dos seguintes ícones:

1. **Android/Chrome:**
   - `icon-192.png` - 192x192 pixels
   - `icon-512.png` - 512x512 pixels

2. **iOS:**
   - `apple-icon-180.png` - 180x180 pixels

3. **Desktop (opcional):**
   - Ícones maiores podem ser úteis

## Design do Ícone

- **Fundo:** Azul (#2563eb ou similar)
- **Texto:** "MudaTech" em branco
- **Estilo:** Moderno, limpo, legível mesmo em tamanhos pequenos

## Ferramentas Recomendadas

### Opção 1: Figma (Recomendado)
1. Crie um canvas de 512x512px
2. Adicione fundo azul (#2563eb)
3. Adicione texto "MudaTech" em branco, fonte moderna
4. Exporte em PNG nos tamanhos necessários

### Opção 2: Canva
1. Crie um design de 512x512px
2. Use template de ícone de app
3. Adicione fundo azul e texto branco
4. Exporte nos tamanhos necessários

### Opção 3: Online (PWA Asset Generator)
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/
- Faça upload de um ícone 512x512 e gere todos os tamanhos

## Localização dos Arquivos

Após criar os ícones, coloque-os em:
- `public/painel/icon-192.png`
- `public/painel/icon-512.png`
- `public/painel/apple-icon-180.png`

## Teste

Após adicionar os ícones:
1. Limpe o cache do navegador
2. Desinstale o app PWA se já estiver instalado
3. Reinstale o app
4. Verifique se os ícones aparecem corretamente

