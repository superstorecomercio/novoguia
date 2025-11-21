import { notFound } from 'next/navigation';
import { getCidadeBySlug, getHotsitesByCidadeSlug, getHotsitesCountByTipo } from '../../../lib/db/queries';
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { Star, Shield, Phone, MapPin, Search, SlidersHorizontal, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface CityPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Helper function to validate image URLs
function getValidImageUrl(url: string | null | undefined, fallback: string = '/placeholder-logo.svg'): string {
  if (!url || url.trim() === '') return fallback;
  
  // Check if it's a valid URL
  try {
    new URL(url);
    return url;
  } catch {
    // If it starts with /, it's a relative path, which is valid
    if (url.startsWith('/')) return url;
    return fallback;
  }
}

const CityPage = async ({ params }: CityPageProps) => {
  const { slug } = await params;
  const city = await getCidadeBySlug(slug);
  const hotsites = await getHotsitesByCidadeSlug(slug);
  const counts = await getHotsitesCountByTipo(slug);

  if (!city) {
    notFound();
  }

  // Mapear slug da cidade para imagem
  const cityImages: Record<string, string> = {
    'sao-paulo-sp': '/s-o-paulo-skyline.jpg',
    'rio-de-janeiro-rj': '/rio-de-janeiro-christ.jpg',
    'belo-horizonte-mg': '/belo-horizonte-cityscape.jpg',
    'brasilia-df': '/brasilia-congress.jpg',
    'curitiba-pr': '/curitiba-architecture.jpg',
    'porto-alegre-rs': '/porto-alegre-downtown.jpg',
  };

  const cityImage = cityImages[slug] || '/placeholder.svg';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero da Cidade */}
      <section className="relative h-[300px] lg:h-[400px] overflow-hidden">
        <Image
          src={cityImage}
          alt={`${city.name}, ${city.state}`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl text-white space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6" />
                <span className="text-xl font-medium">{city.state}</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-balance">
                Empresas de Mudança em {city.name}
              </h1>
              <p className="text-lg lg:text-xl text-white/90 leading-relaxed">
                {hotsites.length > 0 
                  ? `${hotsites.length} empresa${hotsites.length > 1 ? 's' : ''} verificada${hotsites.length > 1 ? 's' : ''} na sua região`
                  : 'Encontre as melhores empresas de mudança'}
              </p>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  <span className="text-sm">Todas verificadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm">Avaliações reais</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros e Busca */}
      <section className="border-b bg-white sticky top-16 z-30 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou serviço..."
                className="pl-10 h-12 rounded-xl border-2 focus:border-primary"
              />
            </div>

            {/* Filtro de Tipo */}
            <Select defaultValue="todos">
              <SelectTrigger className="w-full lg:w-[220px] h-12 rounded-xl border-2">
                <SelectValue placeholder="Tipo de serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos ({counts.mudanca + counts.carreto + counts.guardamoveis})</SelectItem>
                <SelectItem value="Empresa de Mudança">
                  Empresas de Mudanças ({counts.mudanca})
                </SelectItem>
                <SelectItem value="Carretos">Carretos ({counts.carreto})</SelectItem>
                <SelectItem value="Guarda-Móveis">Guarda-Móveis ({counts.guardamoveis})</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Ordenação */}
            <Select defaultValue="plano">
              <SelectTrigger className="w-full lg:w-[220px] h-12 rounded-xl border-2">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plano">Destaque</SelectItem>
                <SelectItem value="nome">Nome A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Lista de Empresas */}
      <section className="py-12 lg:py-20 bg-gradient-to-b from-white to-muted/20 flex-1">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                {hotsites.length} empresa{hotsites.length !== 1 ? 's' : ''} encontrada{hotsites.length !== 1 ? 's' : ''}
              </h2>
              <p className="text-muted-foreground">Compare serviços e solicite orçamentos</p>
            </div>
          </div>

          {/* Grid de Empresas */}
          {hotsites.length > 0 ? (
            <div className="space-y-6">
              {hotsites.map((hotsite) => (
                <Card
                  key={hotsite.id}
                  className="p-6 lg:p-8 border-0 shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Logo e Info Principal */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0 relative">
                        <Image
                          src={getValidImageUrl(hotsite.logoUrl)}
                          alt={hotsite.nomeExibicao || 'Logo da empresa'}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-foreground mb-2">
                              {hotsite.nomeExibicao}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              {hotsite.plano && (
                                <Badge 
                                  variant={hotsite.plano.nome === 'Premium' ? 'default' : 'outline'}
                                  className={
                                    hotsite.plano.nome === 'Premium' 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'border-primary/20'
                                  }
                                >
                                  {hotsite.plano.nome}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="bg-accent/10 text-accent border-0">
                                <Shield className="w-3 h-3 mr-1" />
                                Verificada
                              </Badge>
                              {hotsite.tipoempresa && (
                                <Badge variant="outline" className="border-muted">
                                  {hotsite.tipoempresa}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              {hotsite.cidade && hotsite.estado && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {hotsite.cidade}/{hotsite.estado}
                                </span>
                              )}
                              {hotsite.telefone1 && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {hotsite.telefone1}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Serviços */}
                        {hotsite.servicos && hotsite.servicos.length > 0 && (
                          <div className="grid sm:grid-cols-2 gap-2 mb-4">
                            {hotsite.servicos.slice(0, 4).map((servico, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                                <span className="text-muted-foreground">{servico}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Destaques */}
                        {hotsite.highlights && hotsite.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {hotsite.highlights.slice(0, 3).map((highlight, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="lg:w-64 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <Link href={`/orcamento?empresa=${hotsite.nomeExibicao}&cidade=${slug}`}>
                          <Button size="lg" className="w-full rounded-xl font-semibold text-base">
                            Solicitar Orçamento
                          </Button>
                        </Link>
                        {hotsite.telefone1 && (
                          <a href={`tel:${hotsite.telefone1.replace(/\D/g, '')}`}>
                            <Button 
                              variant="outline" 
                              size="lg" 
                              className="w-full rounded-xl bg-transparent font-semibold"
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Ligar Agora
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  Nenhuma empresa encontrada
                </h3>
                <p className="text-muted-foreground">
                  Ainda não temos empresas cadastradas nesta cidade, mas você pode solicitar orçamentos gerais.
                </p>
                <Link href="/orcamento">
                  <Button size="lg" className="rounded-full font-semibold px-8 mt-4">
                    Solicitar Orçamento Geral
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* CTA Final */}
          {hotsites.length > 0 && (
            <div className="mt-16 text-center p-12 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl border border-primary/10">
              <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 text-balance">
                Não encontrou o que procurava?
              </h3>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Preencha nosso formulário e receba até 4 orçamentos personalizados de empresas verificadas
              </p>
              <Link href="/orcamento">
                <Button size="lg" className="rounded-full font-semibold px-8 text-base">
                  Solicitar Orçamentos Grátis
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CityPage;
