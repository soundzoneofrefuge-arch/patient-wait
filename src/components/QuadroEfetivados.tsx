import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgendamentosEfetivados } from "@/hooks/useAgendamentosEfetivados";
import { CheckCircle, Calendar } from "lucide-react";

export const QuadroEfetivados = () => {
  const { data, isLoading, error } = useAgendamentosEfetivados();

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Efetivados Hoje</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-red-400 text-sm">Erro ao carregar dados</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Efetivados Hoje</CardTitle>
        <CheckCircle className="h-4 w-4 text-green-500" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>
        <div className="text-2xl font-bold text-green-600 mt-2">
          {isLoading ? (
            <div className="animate-pulse">...</div>
          ) : (
            data?.efetivados || 0
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          agendamento{(data?.efetivados || 0) !== 1 ? 's' : ''} que já passou{(data?.efetivados || 0) !== 1 ? 'ram' : 'u'} do horário hoje
        </p>
      </CardContent>
    </Card>
  );
};