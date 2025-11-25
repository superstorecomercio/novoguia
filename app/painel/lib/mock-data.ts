export interface Lead {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  origin_address: string
  destination_address: string
  moving_date: string
  property_type: string
  property_size: string
  has_elevator: boolean
  needs_packing: boolean
  special_items: string[] | null
  additional_notes: string | null
  status: "pending" | "quoted" | "accepted" | "rejected"
  created_at: string
}

export const mockLeads: Lead[] = [
  {
    id: "1",
    customer_name: "Maria Silva Santos",
    customer_email: "maria.silva@email.com",
    customer_phone: "(11) 98765-4321",
    origin_address: "Rua das Flores, 123 - Jardins, São Paulo - SP",
    destination_address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
    moving_date: "2024-02-15",
    property_type: "apartamento",
    property_size: "medio",
    has_elevator: true,
    needs_packing: true,
    special_items: ["Piano", "Quadros valiosos"],
    additional_notes:
      "Mudança precisa ser feita no período da manhã. Tenho um piano de cauda que requer cuidado especial.",
    status: "pending",
    created_at: "2024-01-28T10:30:00Z",
  },
  {
    id: "2",
    customer_name: "João Pedro Costa",
    customer_email: "joao.costa@empresa.com.br",
    customer_phone: "(21) 97654-3210",
    origin_address: "Rua Barata Ribeiro, 456 - Copacabana, Rio de Janeiro - RJ",
    destination_address: "Av. Atlântica, 789 - Copacabana, Rio de Janeiro - RJ",
    moving_date: "2024-02-20",
    property_type: "apartamento",
    property_size: "pequeno",
    has_elevator: true,
    needs_packing: false,
    special_items: null,
    additional_notes: "Já tenho tudo embalado. Preciso apenas do transporte.",
    status: "pending",
    created_at: "2024-01-28T14:15:00Z",
  },
  {
    id: "3",
    customer_name: "Ana Carolina Oliveira",
    customer_email: "ana.oliveira@gmail.com",
    customer_phone: "(31) 99876-5432",
    origin_address: "Rua da Bahia, 321 - Centro, Belo Horizonte - MG",
    destination_address: "Av. do Contorno, 654 - Funcionários, Belo Horizonte - MG",
    moving_date: "2024-02-10",
    property_type: "casa",
    property_size: "grande",
    has_elevator: false,
    needs_packing: true,
    special_items: ["TV 75 polegadas", "Mesa de vidro grande", "Geladeira side by side"],
    additional_notes: "Casa com dois andares. Preciso de ajuda com desmontagem e montagem de móveis também.",
    status: "quoted",
    created_at: "2024-01-27T09:00:00Z",
  },
  {
    id: "4",
    customer_name: "Roberto Almeida",
    customer_email: "roberto.almeida@outlook.com",
    customer_phone: "(85) 98123-4567",
    origin_address: "Rua Major Facundo, 100 - Centro, Fortaleza - CE",
    destination_address: "Av. Beira Mar, 2500 - Meireles, Fortaleza - CE",
    moving_date: "2024-02-25",
    property_type: "apartamento",
    property_size: "pequeno",
    has_elevator: false,
    needs_packing: false,
    special_items: null,
    additional_notes: null,
    status: "pending",
    created_at: "2024-01-28T16:45:00Z",
  },
  {
    id: "5",
    customer_name: "Fernanda Rodrigues Lima",
    customer_email: "fernanda.lima@email.com",
    customer_phone: "(41) 97777-8888",
    origin_address: "Rua XV de Novembro, 500 - Centro, Curitiba - PR",
    destination_address: "Rua Comendador Araújo, 300 - Batel, Curitiba - PR",
    moving_date: "2024-03-01",
    property_type: "apartamento",
    property_size: "medio",
    has_elevator: true,
    needs_packing: true,
    special_items: ["Aquário grande", "Plantas", "Objetos de arte"],
    additional_notes:
      "Tenho um aquário de 200L que precisa ser transportado com muito cuidado. Também tenho várias plantas grandes.",
    status: "pending",
    created_at: "2024-01-28T11:20:00Z",
  },
]

export function getMockStats() {
  const totalLeads = mockLeads.length
  const pendingLeads = mockLeads.filter((lead) => lead.status === "pending").length
  const quotedLeads = mockLeads.filter((lead) => lead.status === "quoted").length

  return {
    totalLeads,
    pendingLeads,
    quotedLeads,
  }
}

export interface CompanyProfile {
  id: string
  name: string
  logo: string | null
  description: string
  email: string
  phone: string
  address: string
  cnpj: string
  services: string[]
  created_at: string
}

export const mockCompanyProfile: CompanyProfile = {
  id: "1",
  name: "MudaTech Transportes",
  logo: null,
  description:
    "Empresa especializada em mudanças residenciais e comerciais com mais de 15 anos de experiência no mercado. Oferecemos serviços completos de embalagem, transporte e montagem de móveis com tecnologia e qualidade.",
  email: "contato@mudatech.com.br",
  phone: "(11) 3456-7890",
  address: "Rua dos Transportes, 1000 - Vila Industrial, São Paulo - SP, CEP 01234-567",
  cnpj: "12.345.678/0001-90",
  services: [
    "Mudanças Residenciais",
    "Mudanças Comerciais",
    "Embalagem Completa",
    "Desmontagem e Montagem de Móveis",
    "Transporte de Itens Especiais",
    "Içamento",
    "Armazenamento Temporário",
  ],
  created_at: "2024-01-01T00:00:00Z",
}
