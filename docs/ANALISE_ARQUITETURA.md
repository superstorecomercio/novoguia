# Análise da Arquitetura - Guia de Mudanças

## 1. ARQUITETURA ATUAL E FLUXO PRINCIPAL DO USUÁRIO

### 1.1 Como o Visitante Chega

O site utiliza **ASP.NET WebForms** (Visual Studio 2015) e funciona da seguinte forma:

1. **Página Inicial**: O visitante acessa `/` ou `/mudancas/mudancas.aspx` (definido como página padrão no `web.config`)
   - Arquivo principal: `index.aspx` ou `mudancas/mudancas.aspx`
   - Exibe informações sobre o serviço, lista de cidades por região e links para solicitar orçamentos

2. **Navegação por Cidade**: O usuário pode:
   - Clicar em links de cidades na homepage (ex: "São Paulo", "Rio de Janeiro")
   - Acessar diretamente URLs como `/mudancas/Cidade.aspx?estado=SP&cidade=São Paulo`
   - Buscar empresas pelo nome em `/mudancas/buscanome.aspx`

### 1.2 Como Escolhe Cidade

O sistema oferece múltiplas formas de seleção:

1. **Página de Cidade** (`mudancas/Cidade.aspx`):
   - Recebe parâmetros `estado` e `cidade` via QueryString
   - Permite filtrar por bairro e tipo de serviço (Mudança, Carreto, Guarda-Móveis, etc.)
   - Carrega empresas usando `ConsultaEmpresasPorCidade()` ou `ConsultaEmpresasPorCidadeBairro()`

2. **Páginas Específicas por Cidade**:
   - Existem páginas dedicadas para principais cidades (ex: `mudancas-sp-saopaulo.aspx`, `mudancas-rj-riodejaneiro.aspx`)
   - Essas páginas são otimizadas para SEO e têm conteúdo específico

3. **Menu de Navegação**:
   - Menu dropdown com cidades organizadas por região (Sudeste, Sul, Nordeste, etc.)

### 1.3 Como Vê as Empresas de Mudança

Após selecionar a cidade, o sistema:

1. **Consulta o Banco de Dados**:
   - Usa stored procedures como `ConsultaEmpresasPorCidade`
   - Filtra empresas ativas que atendem àquela cidade/estado
   - Considera planos de publicidade (Top, Quality, Standard, Intermediário)

2. **Exibe Listagem**:
   - Mostra até 30 empresas por página (paginação)
   - Cada empresa exibe: nome, telefone, endereço, tipo de serviço, avaliações
   - Empresas são ordenadas por plano de publicidade (Top primeiro)

3. **Detalhes da Empresa**:
   - Ao clicar em uma empresa, pode ver mais detalhes (hotsite)
   - Informações incluem: fotos, serviços oferecidos, descontos, formas de pagamento

### 1.4 Como Preenche o Formulário de Orçamento

O formulário principal está em `/mudancas/recebaorcamentos.aspx`:

1. **Fluxo do Formulário** (multi-step):
   - **Passo 1 - Origem**: Seleciona estado/cidade de origem
   - **Passo 2 - Destino**: Seleciona estado/cidade de destino
   - **Passo 3 - Serviço**: Escolhe tipo (Mudança ou Carreto)
   - **Passo 4 - Detalhes**: 
     - Para Mudança: número de cômodos, estilo de vida, descrição dos itens
     - Para Carreto: número de peças, descrição
   - **Passo 5 - Dados Pessoais**: Nome, email, telefone, preferência de contato

2. **Validações**:
   - Verifica se o email é válido
   - Verifica se já enviou orçamento hoje pelo mesmo IP (limite de spam)
   - Valida campos obrigatórios

3. **Opções Especiais**:
   - Pode solicitar orçamento para múltiplas empresas (padrão) ou empresa específica
   - Pode escolher preferência de contato (WhatsApp, Email, Telefone)

### 1.5 Como o Orçamento é Gravado

Após preencher o formulário:

1. **Inserção no Banco**:
   - Chama método `webincluiorcamento()` da classe `CNEmpresa`
   - Insere registro na tabela `WebOrcamento` com:
     - Dados do cliente (nome, email, telefone)
     - Origem e destino (estado, cidade, endereço, bairro)
     - Tipo de serviço
     - Descrição dos itens
     - IP do cliente
     - Data de envio

2. **Seleção de Empresas**:
   - Sistema identifica empresas que atendem origem E/OU destino
   - Filtra por planos de publicidade (Top, Quality, Standard, Intermediário)
   - Insere relacionamentos na tabela `painelorcamentos` (empresa ↔ orçamento)

3. **Envio de Emails**:
   - Envia email para cada empresa selecionada com detalhes do orçamento
   - Envia email de confirmação para o cliente
   - Atualiza campo `envios_recebaorcamentos` na tabela `WebOrcamento`

4. **Página de Confirmação**:
   - Redireciona para `/mudancas/orcamentoenviado.aspx`
   - Exibe lista de empresas que receberam o orçamento
   - Mostra estimativa de material de embalagem necessário

### 1.6 Arquivos Centrais do Fluxo

**Páginas Principais:**
- `index.aspx` - Homepage
- `mudancas/mudancas.aspx` - Página principal de mudanças
- `mudancas/Cidade.aspx` - Listagem de empresas por cidade
- `mudancas/recebaorcamentos.aspx` - Formulário de solicitação de orçamento
- `mudancas/orcamentoenviado.aspx` - Confirmação de envio
- `mudancas/empresa-de-mudanca.aspx` - Página genérica de empresas

**Classes de Negócio (VB.NET):**
- `guiaCN/CNEmpresa.vb` - Lógica de negócio para empresas e orçamentos
- `database/database.vb` - Acesso ao banco de dados
- `mudancas/recebaorcamentos.aspx.vb` - Code-behind do formulário
- `mudancas/Cidade.aspx.vb` - Code-behind da listagem

---

## 2. MAPEAMENTO DE URLs IMPORTANTES

| URL Atual | Arquivo Responsável | Descrição | SEO |
|-----------|---------------------|-----------|-----|
| `/` ou `/mudancas/mudancas.aspx` | `index.aspx` ou `mudancas/mudancas.aspx` | Homepage - Página inicial do site | SIM |
| `/mudancas/Cidade.aspx?estado=SP&cidade=São Paulo` | `mudancas/Cidade.aspx` | Listagem de empresas por cidade | SIM |
| `/mudancas/mudancas-sp-saopaulo.aspx` | `mudancas/mudancas-sp-saopaulo.aspx` | Página específica São Paulo | SIM |
| `/mudancas/mudancas-rj-riodejaneiro.aspx` | `mudancas/mudancas-rj-riodejaneiro.aspx` | Página específica Rio de Janeiro | SIM |
| `/mudancas/mudancas-campinas-interior-sp.aspx` | `mudancas/mudancas-campinas-interior-sp.aspx` | Página específica Campinas | SIM |
| `/mudancas/mudancas-belohorizonte-mg.aspx` | `mudancas/mudancas-belohorizonte-mg.aspx` | Página específica Belo Horizonte | SIM |
| `/mudancas/mudancas-curitiba-parana.aspx` | `mudancas/mudancas-curitiba-parana.aspx` | Página específica Curitiba | SIM |
| `/mudancas/mudancas-portoalegre-rs.aspx` | `mudancas/mudancas-portoalegre-rs.aspx` | Página específica Porto Alegre | SIM |
| `/mudancas/mudancas-df-brasilia.aspx` | `mudancas/mudancas-df-brasilia.aspx` | Página específica Brasília | SIM |
| `/mudancas/recebaorcamentos.aspx` | `mudancas/recebaorcamentos.aspx` | Formulário de solicitação de orçamento | SIM |
| `/mudancas/recebaorcamentos.aspx?codempresa=123` | `mudancas/recebaorcamentos.aspx` | Formulário para empresa específica | NÃO |
| `/mudancas/orcamentoenviado.aspx` | `mudancas/orcamentoenviado.aspx` | Confirmação de envio de orçamento | NÃO |
| `/mudancas/buscanome.aspx` | `mudancas/buscanome.aspx` | Busca de empresas por nome | SIM |
| `/mudancas/carretos.aspx` | `mudancas/carretos.aspx` | Página de carretos | SIM |
| `/mudancas/guardamoveis.aspx` | `mudancas/guardamoveis.aspx` | Página de guarda-móveis | SIM |
| `/mudancas/transportadora.aspx` | `mudancas/transportadora.aspx` | Página de transportadoras | SIM |
| `/mudancas/montador-de-moveis.aspx` | `mudancas/montador-de-moveis.aspx` | Página de montadores | SIM |
| `/mudancas/quemsomos.aspx` | `mudancas/quemsomos.aspx` | Página institucional - Quem somos | SIM |
| `/mudancas/faleconosco.aspx` | `mudancas/faleconosco.aspx` | Página de contato | SIM |
| `/mudancas/anuncie2.aspx` | `mudancas/anuncie2.aspx` | Página para empresas anunciarem | SIM |
| `/mudancas/termos.aspx` | `mudancas/termos.aspx` | Termos e condições | SIM |
| `/mudancas/dicas-de-mudancas.aspx` | `mudancas/dicas-de-mudancas.aspx` | Blog/Dicas de mudanças | SIM |
| `/mudancas/CalculadoraEmbalagem.aspx` | `mudancas/CalculadoraEmbalagem.aspx` | Calculadora de material de embalagem | SIM |
| `/mudancas/hotsite.aspx?codempresa=123` | `mudancas/hotsite.aspx` | Página de detalhes da empresa (hotsite) | SIM |
| `/mudancas/orcamento-guardamoveis.aspx` | `mudancas/orcamento-guardamoveis.aspx` | Formulário específico para guarda-móveis | SIM |
| `/mudancas/mudancainterestadual.aspx` | `mudancas/mudancainterestadual.aspx` | Página de mudanças interestaduais | SIM |
| `/mudancas/mudancas-bahia-salvador.aspx` | `mudancas/mudancas-bahia-salvador.aspx` | Página específica Salvador | SIM |
| `/mudancas/mudancas-pernambuco-pe.aspx` | `mudancas/mudancas-pernambuco-pe.aspx` | Página específica Pernambuco | SIM |
| `/mudancas/mudancas-vitoria-es.aspx` | `mudancas/mudancas-vitoria-es.aspx` | Página específica Vitória | SIM |
| `/mudancas/mudancas-mato-grosso.aspx` | `mudancas/mudancas-mato-grosso.aspx` | Página específica Mato Grosso | SIM |
| `/mudancas/abc-sp.aspx` | `mudancas/abc-sp.aspx` | Página região ABC/SP | SIM |
| `/mudancas/litoral-sp.aspx` | `mudancas/litoral-sp.aspx` | Página litoral SP | SIM |
| `/mudancas/zonasul-sp.aspx` | `mudancas/zonasul-sp.aspx` | Página zona sul SP | SIM |
| `/mudancas/zonanorte-sp.aspx` | `mudancas/zonanorte-sp.aspx` | Página zona norte SP | SIM |
| `/mudancas/zonaleste-sp.aspx` | `mudancas/zonaleste-sp.aspx` | Página zona leste SP | SIM |
| `/mudancas/zonaoeste-sp.aspx` | `mudancas/zonaoeste-sp.aspx` | Página zona oeste SP | SIM |
| `/mudancas/centro-sp.aspx` | `mudancas/centro-sp.aspx` | Página centro SP | SIM |
| `/mudancas/zonasul-rj.aspx` | `mudancas/zonasul-rj.aspx` | Página zona sul RJ | SIM |
| `/mudancas/zonanorte-rj.aspx` | `mudancas/zonanorte-rj.aspx` | Página zona norte RJ | SIM |
| `/mudancas/zonaleste-rj.aspx` | `mudancas/zonaleste-rj.aspx` | Página zona leste RJ | SIM |
| `/mudancas/zonaoeste-rj.aspx` | `mudancas/zonaoeste-rj.aspx` | Página zona oeste RJ | SIM |
| `/mudancas/centro-rj.aspx` | `mudancas/centro-rj.aspx` | Página centro RJ | SIM |
| `/mudancas/niteroi-rj.aspx` | `mudancas/niteroi-rj.aspx` | Página Niterói/RJ | SIM |
| `/mudancas/aracaju.aspx` | `mudancas/aracaju.aspx` | Página específica Aracaju | SIM |
| `/mudancas/belem.aspx` | `mudancas/belem.aspx` | Página específica Belém | SIM |
| `/mudancas/campogrande.aspx` | `mudancas/campogrande.aspx` | Página específica Campo Grande | SIM |
| `/mudancas/florianopolis.aspx` | `mudancas/florianopolis.aspx` | Página específica Florianópolis | SIM |
| `/mudancas/fortaleza.aspx` | `mudancas/fortaleza.aspx` | Página específica Fortaleza | SIM |
| `/mudancas/goiania.aspx` | `mudancas/goiania.aspx` | Página específica Goiânia | SIM |
| `/mudancas/joaopessoa.aspx` | `mudancas/joaopessoa.aspx` | Página específica João Pessoa | SIM |
| `/mudancas/maceio.aspx` | `mudancas/maceio.aspx` | Página específica Maceió | SIM |
| `/mudancas/manaus.aspx` | `mudancas/manaus.aspx` | Página específica Manaus | SIM |
| `/mudancas/natal.aspx` | `mudancas/natal.aspx` | Página específica Natal | SIM |
| `/mudancas/saoluis.aspx` | `mudancas/saoluis.aspx` | Página específica São Luís | SIM |
| `/mudancas/teresina.aspx` | `mudancas/teresina.aspx` | Página específica Teresina | SIM |
| `/mudancas/parceiros.aspx` | `mudancas/parceiros.aspx` | Página de parceiros | SIM |
| `/mudancas/certificados.aspx` | `mudancas/certificados.aspx` | Página de certificados | SIM |
| `/mudancas/distancia-entre-cidades.aspx` | `mudancas/distancia-entre-cidades.aspx` | Calculadora de distância | SIM |
| `/mudancas/calcular-distancia-entre-cidades.aspx` | `mudancas/calcular-distancia-entre-cidades.aspx` | Calculadora de distância (alternativa) | SIM |
| `/mudancas/precos-de-carretos.aspx` | `mudancas/precos-de-carretos.aspx` | Artigo sobre preços de carretos | SIM |
| `/mudancas/quanto-custa-uma-mudanca-residencial.aspx` | `mudancas/quanto-custa-uma-mudanca-residencial.aspx` | Artigo sobre preços | SIM |
| `/mudancas/quanto-custa-uma-mudanca-interestadual.aspx` | `mudancas/quanto-custa-uma-mudanca-interestadual.aspx` | Artigo sobre preços interestaduais | SIM |
| `/mudancas/como-escolher-uma-empresa-de-mudanca.aspx` | `mudancas/como-escolher-uma-empresa-de-mudanca.aspx` | Artigo educativo | SIM |
| `/mudancas/organizar-sua-mudanca.aspx` | `mudancas/organizar-sua-mudanca.aspx` | Artigo educativo | SIM |
| `/mudancas/contratar-empresa-de-mudancas.aspx` | `mudancas/contratar-empresa-de-mudancas.aspx` | Artigo educativo | SIM |
| `/mudancas/qual-preco-de-guarda-moveis-em-saopaulo-sp.aspx` | `mudancas/qual-preco-de-guarda-moveis-em-saopaulo-sp.aspx` | Artigo sobre guarda-móveis | SIM |
| `/mudancas/Icamento-precos.aspx` | `mudancas/Icamento-precos.aspx` | Página sobre içamentos | SIM |
| `/mudancas/cidades-rotas.aspx` | `mudancas/cidades-rotas.aspx` | Página de rotas entre cidades | SIM |
| `/mudancas/carreto-rotas.aspx` | `mudancas/carreto-rotas.aspx` | Página de rotas para carretos | SIM |
| `/mudancas/transportadora-rotas.aspx` | `mudancas/transportadora-rotas.aspx` | Página de rotas para transportadoras | SIM |
| `/mudancas/guarda-moveis-e-self-storage.aspx` | `mudancas/guarda-moveis-e-self-storage.aspx` | Página sobre guarda-móveis e self storage | SIM |
| `/mudancas/selfstorage_guardamoveis.aspx` | `mudancas/selfstorage_guardamoveis.aspx` | Página self storage | SIM |
| `/mudancas/SelfStorage_Reserva.aspx` | `mudancas/SelfStorage_Reserva.aspx` | Reserva de self storage | SIM |
| `/mudancas/mudanca-internacional.aspx` | `mudancas/mudanca-internacional.aspx` | Página mudanças internacionais | SIM |
| `/mudancas/mudancaresidencial.aspx` | `mudancas/mudancaresidencial.aspx` | Página mudanças residenciais | SIM |
| `/mudancas/vantagens.aspx` | `mudancas/vantagens.aspx` | Página de vantagens | SIM |
| `/mudancas/servicos.aspx` | `mudancas/servicos.aspx` | Página de serviços | SIM |
| `/mudancas/news.aspx` | `mudancas/news.aspx` | Página de notícias/blog | SIM |
| `/mudancas/As-10-maiores-cidades-do-brasil-por-populacao.aspx` | `mudancas/As-10-maiores-cidades-do-brasil-por-populacao.aspx` | Artigo educativo | SIM |
| `/mudancas/caixas-de-papelao.aspx` | `mudancas/caixas-de-papelao.aspx` | Artigo sobre caixas | SIM |
| `/mudancas/Caixas-para-mudanca-kit.aspx` | `mudancas/Caixas-para-mudanca-kit.aspx` | Artigo sobre kits de caixas | SIM |
| `/mudancas/dicas-de-mudancas-4-semanas-antes.aspx` | `mudancas/dicas-de-mudancas-4-semanas-antes.aspx` | Artigo educativo | SIM |
| `/mudancas/assinatura.aspx` | `mudancas/assinatura.aspx` | Página de assinatura (planos) | SIM |
| `/mudancas/assinaturaefetuada.aspx` | `mudancas/assinaturaefetuada.aspx` | Confirmação de assinatura | NÃO |
| `/mudancas/pagseguro.aspx` | `mudancas/pagseguro.aspx` | Integração PagSeguro | NÃO |
| `/mudancas/erro404.aspx` | `mudancas/erro404.aspx` | Página de erro 404 | NÃO |
| `/mudancas/orcamentojaenviado.aspx` | `mudancas/orcamentojaenviado.aspx` | Aviso de orçamento já enviado | NÃO |
| `/mudancas/obrigadofale.aspx` | `mudancas/obrigadofale.aspx` | Agradecimento contato | NÃO |
| `/mudancas/enviado_guardamoveis.aspx` | `mudancas/enviado_guardamoveis.aspx` | Confirmação guarda-móveis | NÃO |
| `/mudancas/avaliacao-enviada.aspx` | `mudancas/avaliacao-enviada.aspx` | Confirmação de avaliação | NÃO |
| `/mudancas/campanha-doe-para-mudar.aspx` | `mudancas/campanha-doe-para-mudar.aspx` | Página de campanha | SIM |
| `/login.aspx` | `login.aspx` | Login administrativo | NÃO |
| `/painel/painel.aspx` | `painel/painel.aspx` | Painel administrativo | NÃO |

---

## 3. MAPEAMENTO DO BANCO DE DADOS

### 3.1 Informações de Conexão

**Banco de Dados**: SQL Server
**Nome do Banco**: `netmude3`
**Connection String** (do `web.config`):
```
Data Source=VPSKINGW0204;Initial Catalog=netmude3;User ID=sa;Password=121212jr
```

### 3.2 Tabelas Principais

| Nome da Tabela | Principais Colunas | Descrição |
|----------------|-------------------|-----------|
| **guiaEmpresa** | codEmpresa, nomEmpresa, CNPJ, Responsavel, telefone, Email, Endereco, Complemento, codCidade | Tabela principal de empresas cadastradas. Armazena dados básicos da empresa e relaciona com cidade através de codCidade. |
| **guiaCidade** | codCidade, nomCidade | Tabela de cidades disponíveis no sistema. Relaciona com empresas através de FK. |
| **guiaHotsite** | codHotsite, codEmpresa, hotEmpresa, hotEndereco, hotCidade, hotEstado, hotDescricao, hotLogotipo, hotFoto1-3, hotServico1-10, hotDesconto1-3, hotFormaPagto1-5 | Tabela de detalhes expandidos das empresas (hotsites). Contém informações de marketing, fotos, serviços oferecidos, descontos e formas de pagamento. Relaciona com guiaEmpresa através de codEmpresa. |
| **WebOrcamento** | codorcamento, tipo, nome, email, telefone, dataestimada, estadoorigem, cidadeorigem, enderecoorigem, bairroorigem, estadodestino, cidadedestino, enderecodestino, bairrodestino, descricao, ip, dataenvio, empresaorigem, emailorigem, empresadestino, emaildestino, envios_recebaorcamentos | Tabela principal de orçamentos solicitados pelos clientes. Armazena todos os dados do formulário de solicitação, incluindo origem, destino, dados do cliente e lista de empresas que receberam o orçamento. |
| **painelorcamentos** | codempresa, codorcamento | Tabela de relacionamento N:N entre empresas e orçamentos. Indica quais empresas receberam cada orçamento. |
| **guiaCampanha** | codCampanha, codEmpresa, codPublicidade, datainicio, datafim, valortotal, datacobranca | Tabela de campanhas publicitárias das empresas. Controla períodos de publicidade e valores cobrados. |
| **guiaPublicidade** | codPublicidade, desPublicidade, codPagina | Tabela de tipos de publicidade disponíveis (ex: Top, Quality, Standard, Intermediário). Relaciona com páginas através de codPagina. |
| **guiaPagina** | codPagina, desPagina | Tabela de páginas do site onde a publicidade pode aparecer. |
| **guiaEmpPub** | codEmpPub, codEmpresa, codhotsite, codpublicidade | Tabela de relacionamento entre empresas, hotsites e tipos de publicidade. Define qual tipo de publicidade cada empresa tem em cada hotsite. |
| **guiaUsuario** | codusuario, nomUsuario, senhaUsuario, tipoUsuario, ultimologin, ultimologoff | Tabela de usuários administrativos do sistema. |
| **WebOrcamentoGM** | codorcamento, tipo, nome, email, telefone, dataestimada, mensagem, contato, oqueprecisa, dataenvio, estado, cidade, empresas, emailempresas, ip, dataip2 | Tabela específica para orçamentos de guarda-móveis. Similar à WebOrcamento mas com campos específicos para este serviço. |
| **guiaplanos** | codigo, estado, cidade, plano, valor, exibeplano, destaque, pagSeguro | Tabela de planos de assinatura disponíveis por cidade/estado. Define valores e características de cada plano. |

### 3.3 Relacionamentos Principais

1. **guiaEmpresa** → **guiaCidade** (N:1)
   - Uma empresa pertence a uma cidade
   - FK: `guiaEmpresa.codCidade` → `guiaCidade.codCidade`

2. **guiaHotsite** → **guiaEmpresa** (1:1)
   - Cada empresa pode ter um hotsite
   - FK: `guiaHotsite.codEmpresa` → `guiaEmpresa.codEmpresa`

3. **guiaCampanha** → **guiaEmpresa** (N:1)
   - Uma empresa pode ter múltiplas campanhas
   - FK: `guiaCampanha.codEmpresa` → `guiaEmpresa.codEmpresa`

4. **guiaCampanha** → **guiaPublicidade** (N:1)
   - Uma campanha tem um tipo de publicidade
   - FK: `guiaCampanha.codPublicidade` → `guiaPublicidade.codPublicidade`

5. **guiaPublicidade** → **guiaPagina** (N:1)
   - Um tipo de publicidade está associado a uma página
   - FK: `guiaPublicidade.codPagina` → `guiaPagina.codPagina`

6. **guiaEmpPub** → **guiaEmpresa** (N:1)
   - Relaciona empresa com publicidade
   - FK: `guiaEmpPub.codEmpresa` → `guiaEmpresa.codEmpresa`

7. **guiaEmpPub** → **guiaHotsite** (N:1)
   - Relaciona hotsite com publicidade
   - FK: `guiaEmpPub.codhotsite` → `guiaHotsite.codHotsite`

8. **guiaEmpPub** → **guiaPublicidade** (N:1)
   - Define tipo de publicidade
   - FK: `guiaEmpPub.codpublicidade` → `guiaPublicidade.codPublicidade`

9. **painelorcamentos** → **guiaEmpresa** (N:1)
   - Relaciona orçamento com empresa
   - FK: `painelorcamentos.codempresa` → `guiaEmpresa.codEmpresa`

10. **painelorcamentos** → **WebOrcamento** (N:1)
    - Relaciona empresa com orçamento
    - FK: `painelorcamentos.codorcamento` → `WebOrcamento.codorcamento`

### 3.4 Stored Procedures Principais

- `procConsultaEmpresa` - Consulta empresas com join em cidades
- `procConsultaCidade` - Lista todas as cidades
- `procIncluirEmpresa` - Insere nova empresa
- `procAlteraEmpresa` - Atualiza dados da empresa
- `procExcluiEmpresa` - Remove empresa
- `ConsultaEmpresasPorCidade` - Busca empresas por cidade/estado
- `ConsultaEmpresasPorCidadeBairro` - Busca empresas por cidade e bairro
- `ConsultaBusca` - Busca empresas por nome
- `ConsultaTipoEmpresa` - Lista tipos de empresa por cidade

---

## 4. ARQUITETURA MODERNA PROPOSTA (Next.js + Supabase)

### 4.1 Visão Geral

A arquitetura moderna será baseada em:
- **Frontend**: Next.js 14+ (App Router) com TypeScript
- **Backend/API**: Next.js API Routes + Supabase Edge Functions (quando necessário)
- **Banco de Dados**: PostgreSQL (Supabase)
- **Autenticação**: Supabase Auth
- **Storage**: Supabase Storage (para imagens/logos)
- **Email**: Resend ou SendGrid (via Supabase Edge Functions)

### 4.2 Estrutura de Pastas Proposta

```
guiademudancas-nextjs/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Rotas públicas
│   │   ├── page.tsx              # Homepage
│   │   ├── mudancas/
│   │   │   ├── [estado]/
│   │   │   │   └── [cidade]/
│   │   │   │       └── page.tsx   # Listagem por cidade
│   │   │   ├── receba-orcamentos/
│   │   │   │   └── page.tsx       # Formulário de orçamento
│   │   │   ├── orcamento-enviado/
│   │   │   │   └── page.tsx       # Confirmação
│   │   │   └── empresa/
│   │   │       └── [id]/
│   │   │           └── page.tsx  # Detalhes da empresa
│   │   ├── carretos/
│   │   ├── guarda-moveis/
│   │   ├── quemsomos/
│   │   ├── faleconosco/
│   │   └── blog/                  # Artigos/dicas
│   ├── (admin)/                   # Rotas administrativas (protegidas)
│   │   ├── dashboard/
│   │   ├── empresas/
│   │   ├── orcamentos/
│   │   └── layout.tsx
│   ├── api/                       # API Routes
│   │   ├── orcamentos/
│   │   │   ├── route.ts           # POST /api/orcamentos
│   │   │   └── [id]/route.ts     # GET /api/orcamentos/[id]
│   │   ├── empresas/
│   │   │   ├── route.ts           # GET /api/empresas
│   │   │   └── [id]/route.ts     # GET /api/empresas/[id]
│   │   ├── cidades/
│   │   │   └── route.ts           # GET /api/cidades
│   │   └── webhooks/
│   │       └── supabase/route.ts  # Webhooks do Supabase
│   ├── layout.tsx                 # Layout raiz
│   └── globals.css
├── components/                     # Componentes React
│   ├── ui/                        # Componentes base (Shadcn)
│   ├── forms/
│   │   └── OrcamentoForm.tsx
│   ├── empresa/
│   │   ├── EmpresaCard.tsx
│   │   └── EmpresaList.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
├── lib/                            # Utilitários
│   ├── supabase/
│   │   ├── client.ts              # Cliente Supabase
│   │   ├── server.ts              # Cliente Supabase Server
│   │   └── types.ts               # Tipos TypeScript gerados
│   ├── db/
│   │   └── queries.ts             # Funções de query
│   └── utils.ts
├── types/                          # Tipos TypeScript
│   └── database.ts
├── supabase/                       # Configuração Supabase
│   ├── migrations/                 # Migrations SQL
│   ├── functions/                 # Edge Functions
│   │   └── send-email/
│   └── config.toml
└── public/                         # Assets estáticos
```

### 4.3 Estrutura do Banco de Dados (PostgreSQL/Supabase)

#### 4.3.1 Tabelas Principais

**empresas**
```sql
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  responsavel VARCHAR(255),
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco VARCHAR(500),
  complemento VARCHAR(255),
  cidade_id UUID REFERENCES cidades(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**cidades**
```sql
CREATE TABLE cidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**hotsites** (detalhes expandidos das empresas)
```sql
CREATE TABLE hotsites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) UNIQUE,
  nome_exibicao VARCHAR(255),
  descricao TEXT,
  endereco VARCHAR(500),
  cidade VARCHAR(255),
  estado VARCHAR(2),
  logo_url TEXT,
  foto1_url TEXT,
  foto2_url TEXT,
  foto3_url TEXT,
  servicos JSONB, -- Array de serviços oferecidos
  descontos JSONB, -- Array de descontos
  formas_pagamento JSONB, -- Array de formas de pagamento
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**orcamentos**
```sql
CREATE TABLE orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL, -- 'mudanca' | 'carreto' | 'guardamoveis'
  nome_cliente VARCHAR(255) NOT NULL,
  email_cliente VARCHAR(255) NOT NULL,
  telefone_cliente VARCHAR(20),
  preferencia_contato JSONB, -- ['whatsapp', 'email', 'telefone']
  
  -- Origem
  estado_origem VARCHAR(2),
  cidade_origem VARCHAR(255),
  endereco_origem VARCHAR(500),
  bairro_origem VARCHAR(255),
  tipo_origem VARCHAR(50), -- 'residencial' | 'comercial'
  
  -- Destino
  estado_destino VARCHAR(2),
  cidade_destino VARCHAR(255),
  endereco_destino VARCHAR(500),
  bairro_destino VARCHAR(255),
  tipo_destino VARCHAR(50),
  
  -- Detalhes do serviço
  descricao TEXT,
  comodos INTEGER, -- Para mudanças
  estilo_vida VARCHAR(50), -- Para mudanças
  pecas INTEGER, -- Para carretos
  
  -- Metadados
  ip_cliente INET,
  data_estimada DATE,
  status VARCHAR(50) DEFAULT 'pendente', -- 'pendente' | 'enviado' | 'respondido'
  created_at TIMESTAMP DEFAULT NOW()
);
```

**orcamento_empresas** (relacionamento N:N)
```sql
CREATE TABLE orcamento_empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  enviado_em TIMESTAMP,
  respondido_em TIMESTAMP,
  UNIQUE(orcamento_id, empresa_id)
);
```

**planos_publicidade**
```sql
CREATE TABLE planos_publicidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(50) NOT NULL, -- 'top' | 'quality' | 'standard' | 'intermediario'
  descricao TEXT,
  ordem INTEGER NOT NULL, -- Para ordenação
  created_at TIMESTAMP DEFAULT NOW()
);
```

**empresa_planos** (relacionamento empresa ↔ plano)
```sql
CREATE TABLE empresa_planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES planos_publicidade(id),
  cidade_id UUID REFERENCES cidades(id),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  valor DECIMAL(10,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**campanhas**
```sql
CREATE TABLE campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id),
  plano_id UUID REFERENCES planos_publicidade(id),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  valor_total DECIMAL(10,2),
  data_cobranca DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.3.2 Índices e Otimizações

```sql
-- Índices para performance
CREATE INDEX idx_empresas_cidade ON empresas(cidade_id);
CREATE INDEX idx_empresas_ativo ON empresas(ativo);
CREATE INDEX idx_orcamentos_email ON orcamentos(email_cliente);
CREATE INDEX idx_orcamentos_created ON orcamentos(created_at DESC);
CREATE INDEX idx_orcamento_empresas_orcamento ON orcamento_empresas(orcamento_id);
CREATE INDEX idx_orcamento_empresas_empresa ON orcamento_empresas(empresa_id);
CREATE INDEX idx_cidades_slug ON cidades(slug);
CREATE INDEX idx_cidades_estado ON cidades(estado);
```

#### 4.3.3 Row Level Security (RLS)

```sql
-- Políticas de segurança para dados públicos
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotsites ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública de empresas ativas
CREATE POLICY "Empresas públicas são visíveis"
  ON empresas FOR SELECT
  USING (ativo = true);

-- Permitir leitura pública de cidades
CREATE POLICY "Cidades são públicas"
  ON cidades FOR SELECT
  USING (true);

-- Orçamentos só podem ser criados por usuários autenticados (ou anônimos com rate limiting)
CREATE POLICY "Orçamentos podem ser criados"
  ON orcamentos FOR INSERT
  WITH CHECK (true);
```

### 4.4 Fluxo de Dados Moderno

#### 4.4.1 Solicitação de Orçamento

1. **Frontend** (`app/(public)/mudancas/receba-orcamentos/page.tsx`):
   - Formulário multi-step com React Hook Form + Zod
   - Validação client-side
   - Submete via `fetch` para `/api/orcamentos`

2. **API Route** (`app/api/orcamentos/route.ts`):
   - Valida dados com Zod
   - Verifica rate limiting (por IP/email)
   - Insere orçamento na tabela `orcamentos`
   - Busca empresas que atendem origem/destino
   - Cria relacionamentos em `orcamento_empresas`
   - Dispara Edge Function para envio de emails

3. **Edge Function** (`supabase/functions/send-email/index.ts`):
   - Envia emails para empresas selecionadas
   - Envia email de confirmação para cliente
   - Atualiza status do orçamento

#### 4.4.2 Listagem de Empresas

1. **Frontend** (`app/(public)/mudancas/[estado]/[cidade]/page.tsx`):
   - Server Component que busca dados
   - Chama função `getEmpresasPorCidade(estado, cidade)`

2. **Query Function** (`lib/db/queries.ts`):
   - Usa Supabase Client para buscar empresas
   - Aplica filtros (tipo de serviço, bairro)
   - Ordena por plano de publicidade
   - Retorna dados formatados

3. **Renderização**:
   - Server Component renderiza lista
   - Client Components para interatividade (filtros, paginação)

### 4.5 Vantagens da Arquitetura Moderna

1. **Performance**:
   - Server Components do Next.js reduzem JavaScript no cliente
   - Edge Functions próximas aos usuários
   - Cache inteligente com ISR (Incremental Static Regeneration)

2. **SEO**:
   - Server-side rendering nativo
   - Meta tags dinâmicas por página
   - Sitemap e robots.txt automáticos

3. **Escalabilidade**:
   - Supabase escala automaticamente
   - Edge Functions escalam por demanda
   - PostgreSQL otimizado para grandes volumes

4. **Desenvolvimento**:
   - TypeScript end-to-end
   - Type safety com tipos gerados do Supabase
   - Hot reload e DX melhorada

5. **Manutenibilidade**:
   - Código organizado e modular
   - Separação clara de responsabilidades
   - Testes mais fáceis de escrever

### 4.6 Migração de Dados

**Estratégia sugerida**:

1. **Fase 1 - Preparação**:
   - Criar schema no Supabase
   - Criar scripts de migração de dados do SQL Server para PostgreSQL
   - Mapear campos e tipos de dados

2. **Fase 2 - Migração Incremental**:
   - Migrar dados históricos em lotes
   - Validar integridade dos dados
   - Criar índices e otimizações

3. **Fase 3 - Desenvolvimento Paralelo**:
   - Desenvolver novo site em Next.js
   - Manter site legado funcionando
   - Testar funcionalidades lado a lado

4. **Fase 4 - Go-Live**:
   - Deploy gradual (feature flags)
   - Monitorar métricas
   - Rollback plan preparado

---

## 5. CONSIDERAÇÕES FINAIS

### 5.1 Pontos de Atenção

- **URLs antigas**: Implementar redirects 301 para manter SEO
- **Emails**: Migrar templates e configurações de SMTP
- **Imagens**: Migrar logos e fotos para Supabase Storage
- **Planos de Publicidade**: Manter lógica de ordenação e priorização
- **Rate Limiting**: Implementar proteção contra spam/abuse

### 5.2 Funcionalidades Adicionais Sugeridas

- Dashboard administrativo moderno
- Sistema de avaliações de empresas
- Chat em tempo real (Supabase Realtime)
- Notificações push para empresas
- Analytics integrado
- API pública para integrações

### 5.3 Próximos Passos

1. Criar projeto Next.js com TypeScript
2. Configurar Supabase e criar schema
3. Implementar migração de dados
4. Desenvolver componentes principais
5. Implementar formulário de orçamento
6. Criar páginas de listagem
7. Implementar sistema de emails
8. Testes e otimizações
9. Deploy e monitoramento

---

**Documento gerado em**: 2024
**Versão**: 1.0
**Autor**: Análise Automatizada do Código Legado

