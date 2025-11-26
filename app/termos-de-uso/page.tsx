import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Termos de Uso | MudaTech",
  description: "Termos de uso e condições do MudaTech",
}

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8">
          Termos de Uso
        </h1>
        
        <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
          <div>
            <p className="text-sm text-gray-500 mb-6">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
            <p className="mb-4">
              Ao acessar e usar o site MudaTech, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. 
              Se você não concorda com alguma parte destes termos, não deve usar nosso serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descrição do Serviço</h2>
            <p className="mb-4">
              O MudaTech é uma plataforma que conecta clientes que precisam de serviços de mudança com empresas de transporte e mudanças. 
              Fornecemos uma ferramenta de cálculo de orçamento estimado e facilitamos o contato entre clientes e empresas parceiras.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Uso do Serviço</h2>
            <p className="mb-4">Você concorda em usar o serviço apenas para fins legais e de acordo com estes termos. Você não deve:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Usar o serviço de forma fraudulenta ou enganosa</li>
              <li>Fornecer informações falsas ou enganosas</li>
              <li>Interferir ou interromper o funcionamento do serviço</li>
              <li>Tentar acessar áreas restritas do sistema</li>
              <li>Usar o serviço para qualquer propósito ilegal</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Orçamentos e Estimativas</h2>
            <p className="mb-4">
              Os valores estimados fornecidos pela plataforma são apenas estimativas baseadas nas informações fornecidas. 
              Os preços finais podem variar e devem ser confirmados diretamente com as empresas de mudança. 
              O MudaTech não se responsabiliza por diferenças entre valores estimados e valores finais cobrados pelas empresas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Empresas Parceiras</h2>
            <p className="mb-4">
              O MudaTech atua como intermediário entre clientes e empresas de mudança. Não somos responsáveis pelos serviços prestados 
              pelas empresas parceiras. Recomendamos que você verifique as credenciais, licenças e avaliações das empresas antes de 
              contratar seus serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Privacidade e Dados</h2>
            <p className="mb-4">
              Seus dados pessoais são tratados de acordo com nossa Política de Privacidade. Ao usar o serviço, você consente com a 
              coleta, uso e compartilhamento de suas informações conforme descrito na política de privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitação de Responsabilidade</h2>
            <p className="mb-4">
              O MudaTech não se responsabiliza por danos diretos, indiretos, incidentais ou consequenciais resultantes do uso ou 
              impossibilidade de uso do serviço. Não garantimos que o serviço estará sempre disponível, seguro ou livre de erros.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modificações dos Termos</h2>
            <p className="mb-4">
              Reservamos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após 
              a publicação. É sua responsabilidade revisar periodicamente estes termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contato</h2>
            <p className="mb-4">
              Se você tiver dúvidas sobre estes termos, entre em contato conosco através do email: 
              <a href="mailto:contato@mudatech.com.br" className="text-[#667eea] hover:underline ml-1">
                contato@mudatech.com.br
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

