import {
  LayoutDashboard,
  Store,
  Package,
  FileText,
  DollarSign,
  BarChart3,
  ClipboardList,
  CheckSquare,
  Truck,
  Settings,
  ScrollText,
  Shield,
  BarChart2,
} from "lucide-react";

export const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Fornecedores", href: "/fornecedores", icon: Store },
  { title: "Peças", href: "/pecas", icon: Package },
  { title: "Cotações", href: "/cotacoes", icon: FileText },
  { title: "Orçamentos", href: "/orcamentos", icon: DollarSign },
  { title: "Comparador", href: "/comparador", icon: BarChart3 },
  { title: "Requisições", href: "/requisicoes", icon: ClipboardList },
  { title: "Aprovação", href: "/aprovacao", icon: CheckSquare },
  { title: "Recebimento", href: "/recebimento", icon: Truck },
  { title: "Ficha de Cotação", href: "/ficha-cotacao", icon: ScrollText },
  { title: "Relatórios", href: "/relatorios", icon: BarChart2 },
  { title: "Auditoria", href: "/auditoria", icon: Shield },
  { title: "Configurações", href: "/configuracoes", icon: Settings },
] as const;

export const mobileNavItems = navItems.filter((item) =>
  ["/dashboard", "/cotacoes", "/requisicoes", "/aprovacao", "/recebimento"].includes(item.href)
);
