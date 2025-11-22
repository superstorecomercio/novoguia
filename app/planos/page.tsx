'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, HelpCircle, MapPin } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

// Estados onde os planos estão disponíveis
const estadosDisponiveis = [
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'PR', nome: 'Curitiba' },
  { sigla: 'GO', nome: 'Goiânia' },
  { sigla: 'RS', nome: 'Porto Alegre' },
];

// Plano único disponível
const plano = {
  nome: 'Plano Anual',
  preco: 199,
  periodo: 'mês',
  descricao: 'Plano completo para sua empresa de mudanças',
  beneficios: [
    'Orçamentos qualificados mensalmente',
    'Perfil completo no Guia de Mudanças',
    'Listagem destacada em páginas de cidades',
    'Suporte prioritário',
    'Atualização de dados quando necessário',
    'Relatórios de performance',
    'Badge "Verificado"',
    'Campanhas promocionais',
  ],
  cta: 'Assinar este plano',
};

const faqs = [
  {
    pergunta: 'Posso cancelar quando quiser?',
    resposta: 'Sim! Você pode cancelar seu plano a qualquer momento sem multas ou taxas. O acesso permanece ativo até o final do período pago.',
  },
  {
    pergunta: 'Como recebo os orçamentos?',
    resposta: 'Os orçamentos são enviados diretamente para o email cadastrado e também aparecem no seu painel administrativo. Você recebe notificações em tempo real.',
  },
  {
    pergunta: 'Os leads são exclusivos?',
    resposta: 'Sim, cada orçamento é enviado para até 4 empresas selecionadas com base na localização e tipo de serviço. Você compete apenas com empresas relevantes.',
  },
  {
    pergunta: 'Posso mudar de plano depois?',
    resposta: 'Claro! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. A diferença será calculada proporcionalmente.',
  },
  {
    pergunta: 'Há taxa de setup ou contrato mínimo?',
    resposta: 'Não! Não cobramos taxa de setup e não há contrato mínimo. Você paga apenas o valor mensal do plano escolhido.',
  },
  {
    pergunta: 'Como funciona o pagamento?',
    resposta: 'Aceitamos cartão de crédito, PIX e boleto. O pagamento é recorrente mensal e você pode gerenciar tudo pelo painel administrativo.',
  },
];

export default function PlanosPage() {
  const [estadoSelecionado, setEstadoSelecionado] = useState<string>('');

  const estadoDisponivel = estadosDisponiveis.find(e => e.sigla === estadoSelecionado);
  const mostrarPlanos = !!estadoDisponivel;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 py-20 lg:py-28">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              Planos para anunciar sua empresa de mudanças
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Receba orçamentos qualificados através do Guia de Mudanças. 
              Escolha o plano ideal para sua empresa e comece a crescer hoje mesmo.
            </p>

            {/* Seletor de Estado */}
            <div className="mb-8 max-w-md mx-auto">
              <label className="block text-sm font-medium text-foreground mb-3">
                Selecione seu estado
              </label>
              <Select value={estadoSelecionado} onValueChange={setEstadoSelecionado}>
                <SelectTrigger className="w-full h-12 rounded-xl border-2 text-base">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Escolha seu estado" />
                </SelectTrigger>
                <SelectContent>
                  {estadosDisponiveis.map((estado) => (
                    <SelectItem key={estado.sigla} value={estado.sigla}>
                      {estado.nome} ({estado.sigla})
                    </SelectItem>
                  ))}
                  <SelectItem value="outro">Outro estado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!mostrarPlanos && estadoSelecionado && (
              <div className="mb-6">
                <Button 
                  size="lg" 
                  className="rounded-full px-8 text-base font-semibold h-12"
                  asChild
                >
                  <a href="https://wa.me/5511999999999?text=Olá, gostaria de saber mais sobre os planos para meu estado" target="_blank" rel="noopener noreferrer">
                    Falar com consultor
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Plano Section ou Mensagem para outros estados */}
      {mostrarPlanos ? (
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-lg text-muted-foreground">
                Plano disponível para <span className="font-semibold text-foreground">{estadoDisponivel?.nome}</span>
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <Card className="relative p-8 lg:p-12 rounded-2xl border-2 border-primary shadow-xl transition-all duration-300 hover:shadow-2xl">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-foreground mb-3">
                    {plano.nome}
                  </h3>
                  <p className="text-base text-muted-foreground mb-8">
                    {plano.descricao}
                  </p>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-6xl font-bold text-foreground">
                      R$ {plano.preco}
                    </span>
                    <span className="text-xl text-muted-foreground">/{plano.periodo}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pagamento mensal recorrente
                  </p>
                </div>

                <div className="border-t border-b border-gray-200 py-8 my-8">
                  <ul className="space-y-4">
                    {plano.beneficios.map((beneficio, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-base text-foreground">
                          {beneficio}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  className="w-full rounded-xl h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                  asChild
                >
                  <Link href="/cadastro">
                    {plano.cta}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </Card>
            </div>
          </div>
        </section>
      ) : estadoSelecionado === 'outro' || (estadoSelecionado && !mostrarPlanos) ? (
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <Card className="p-12 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Planos em breve para seu estado
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    Estamos expandindo nossos serviços! Atualmente, nossos planos estão disponíveis 
                    para <strong>São Paulo, Rio de Janeiro, Curitiba, Goiânia e Porto Alegre</strong>.
                  </p>
                  <p className="text-base text-muted-foreground mb-8">
                    Entre em contato conosco para saber quando os planos estarão disponíveis na sua região 
                    ou para discutir opções personalizadas.
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="rounded-full px-8 text-base font-semibold h-12"
                  asChild
                >
                  <a href="https://wa.me/5511999999999?text=Olá, gostaria de saber sobre planos para meu estado" target="_blank" rel="noopener noreferrer">
                    Falar com consultor
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
              </Card>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <Card className="p-12 bg-muted/30 border-0">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Selecione seu estado para ver os planos
                  </h2>
                  <p className="text-muted-foreground">
                    Escolha o estado onde sua empresa está localizada para visualizar os planos disponíveis.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* FAQs Section */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Perguntas Frequentes
              </h2>
              <p className="text-lg text-muted-foreground">
                Tire suas dúvidas sobre nossos planos e serviços
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card
                  key={index}
                  className="p-6 border-0 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <HelpCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {faq.pergunta}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.resposta}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Card className="p-12 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Pronto para começar?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Escolha seu plano e comece a receber orçamentos qualificados hoje mesmo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="rounded-full px-8 font-semibold"
                  asChild
                >
                  <Link href="/cadastro">
                    Criar conta grátis
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="rounded-full px-8 font-semibold"
                  asChild
                >
                  <a href="https://wa.me/5511999999999?text=Olá, gostaria de saber mais sobre os planos" target="_blank" rel="noopener noreferrer">
                    Falar com consultor
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

