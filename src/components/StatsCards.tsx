import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, TrendingUp, BarChart3 } from "lucide-react";
import { useAgendamentosStats } from "@/hooks/useAgendamentos";

export const StatsCards = () => {
  const { data: stats, isLoading } = useAgendamentosStats();

  const statsData = [
    {
      title: "Total de Agendamentos",
      value: isLoading ? "..." : Math.floor(stats?.totalAgendamentos || 0).toString(),
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30"
    },
    {
      title: "Agendamentos Hoje",
      value: isLoading ? "..." : Math.floor(stats?.agendamentosHoje || 0).toString(), 
      icon: Calendar,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/30"
    },
    {
      title: "Profissionais Ativos",
      value: isLoading ? "..." : Math.floor(stats?.profissionaisAtivos || 0).toString(),
      icon: Users,
      color: "text-warning", 
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30"
    },
    {
      title: "Taxa de Ocupação Diária",
      value: isLoading ? "..." : stats?.taxaOcupacao || "0%",
      icon: BarChart3,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      {statsData.map((stat, index) => (
        <Card 
          key={index} 
          className={`group hover:shadow-glow-sm transition-all duration-300 border ${stat.borderColor} hover:border-primary/40`}
        >
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  {stat.title}
                </p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 md:p-4 rounded-xl ${stat.bgColor} border ${stat.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
