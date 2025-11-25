const QuemSomosPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Quem Somos</h1>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Sobre o MudaTech
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            O MudaTech é uma plataforma dedicada a conectar pessoas que
            precisam de serviços de mudança com empresas confiáveis e
            especializadas em todo o Brasil.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Nossa missão é simplificar o processo de encontrar e contratar
            empresas de mudança, oferecendo informações detalhadas, comparação
            de serviços e facilitando a solicitação de orçamentos personalizados.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Nossa Visão
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Ser a principal referência em busca de empresas de mudança no Brasil,
            oferecendo uma experiência transparente, segura e eficiente para
            nossos usuários.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Nossos Valores
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Transparência nas informações e processos</li>
            <li>Compromisso com a qualidade dos serviços</li>
            <li>Facilidade de uso e acesso</li>
            <li>Confiança e segurança</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Como Funcionamos
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Nossa plataforma permite que você encontre empresas de mudança por
            cidade, visualize informações detalhadas sobre cada empresa e
            solicite orçamentos personalizados de forma rápida e simples.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Trabalhamos continuamente para expandir nossa base de empresas
            cadastradas e melhorar a experiência dos usuários.
          </p>
        </section>
      </div>
    </div>
  );
};

export default QuemSomosPage;

