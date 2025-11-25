export default function DashboardFooter() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2025 MudaTech. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">
              Suporte
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Privacidade
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Termos
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
