import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidade | MudaTech",
  description: "Política de privacidade e proteção de dados do MudaTech",
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8">
          Política de Privacidade
        </h1>
        
        <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
          <div>
            <p className="text-sm text-gray-500 mb-6">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introdução</h2>
            <p className="mb-4">
              O MudaTech está comprometido em proteger sua privacidade. Esta Política de Privacidade descreve como coletamos, 
              usamos, armazenamos e protegemos suas informações pessoais quando você usa nosso serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informações que Coletamos</h2>
            <p className="mb-4">Coletamos as seguintes informações quando você usa nosso serviço:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Informações de contato:</strong> nome, email, telefone e WhatsApp</li>
              <li><strong>Informações da mudança:</strong> origem, destino, tipo de imóvel, data estimada</li>
              <li><strong>Informações técnicas:</strong> endereço IP, tipo de navegador, páginas visitadas</li>
              <li><strong>Informações de uso:</strong> como você interage com nosso serviço</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Como Usamos suas Informações</h2>
            <p className="mb-4">Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Conectar você com empresas de mudança parceiras</li>
              <li>Calcular estimativas de preço para sua mudança</li>
              <li>Enviar comunicações relacionadas ao serviço</li>
              <li>Analisar e melhorar a experiência do usuário</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Compartilhamento de Informações</h2>
            <p className="mb-4">
              Compartilhamos suas informações apenas nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Empresas parceiras:</strong> Compartilhamos seus dados de contato e informações da mudança com empresas 
              de mudança para que possam entrar em contato e fornecer orçamentos</li>
              <li><strong>Prestadores de serviço:</strong> Podemos compartilhar informações com provedores de serviços que nos 
              ajudam a operar a plataforma</li>
              <li><strong>Obrigações legais:</strong> Quando exigido por lei ou para proteger nossos direitos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Segurança dos Dados</h2>
            <p className="mb-4">
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, 
              alteração, divulgação ou destruição. No entanto, nenhum método de transmissão pela internet é 100% seguro.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Seus Direitos (LGPD)</h2>
            <p className="mb-4">De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Confirmar a existência de tratamento de dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar anonimização, bloqueio ou eliminação de dados</li>
              <li>Solicitar portabilidade dos dados</li>
              <li>Revogar seu consentimento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies e Tecnologias Similares</h2>
            <p className="mb-4">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do site e personalizar conteúdo. 
              Você pode configurar seu navegador para recusar cookies, mas isso pode afetar algumas funcionalidades do site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Retenção de Dados</h2>
            <p className="mb-4">
              Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos nesta política, 
              a menos que um período de retenção mais longo seja exigido ou permitido por lei.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Alterações nesta Política</h2>
            <p className="mb-4">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas 
              publicando a nova política nesta página e atualizando a data de "Última atualização".
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contato</h2>
            <p className="mb-4">
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados pessoais, entre em contato conosco:
            </p>
            <p className="mb-4">
              <strong>Email:</strong>{" "}
              <a href="mailto:contato@mudatech.com.br" className="text-[#667eea] hover:underline">
                contato@mudatech.com.br
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

