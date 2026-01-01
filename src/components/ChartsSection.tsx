
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer, ComposedChart } from "recharts";
import { useChartsData } from "@/hooks/useChartsData";

const chartConfig = {
  agendamentos: {
    label: "Agendamentos",
    color: "hsl(var(--primary))",
  },
  status: {
    label: "Status",
    color: "hsl(var(--primary))",
  },
  performance: {
    label: "Performance",
    color: "hsl(var(--primary))",
  },
};

export const ChartsSection = () => {
  const { data: chartData, isLoading } = useChartsData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Distribuição por Status */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Distribuição por Status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center px-2 md:px-6">
          <ChartContainer config={chartConfig} className="h-[250px] md:h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData?.statusData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData?.statusData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="flex flex-wrap justify-center mt-4 gap-2 md:gap-4">
            {chartData?.statusData?.map((item, index) => (
              <div key={index} className="flex items-center space-x-1 md:space-x-2">
                <div 
                  className="w-2 h-2 md:w-3 md:h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Horários de Pico */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Horários de Pico
          </CardTitle>
          <p className="text-xs md:text-sm text-muted-foreground">
            Horários mais procurados (dados históricos)
          </p>
        </CardHeader>
        <CardContent className="px-1 md:px-4 pt-2">
          <ChartContainer config={chartConfig} className="h-[200px] md:h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart 
                 data={chartData?.horariosPicoData || []} 
                 margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
               >
                 <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                 <XAxis 
                   dataKey="hora"
                   stroke="hsl(var(--muted-foreground))"
                   fontSize={9}
                   axisLine={false}
                   tickLine={false}
                   tick={{ fill: 'hsl(var(--muted-foreground))' }}
                 />
                 <YAxis 
                   stroke="hsl(var(--muted-foreground))"
                   fontSize={9}
                   axisLine={false}
                   tickLine={false}
                   width={30}
                   tick={{ fill: 'hsl(var(--muted-foreground))' }}
                   allowDecimals={false}
                 />
                 <Line 
                   type="monotone"
                   dataKey="agendamentos" 
                   stroke="hsl(var(--primary))"
                   strokeWidth={2}
                   dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
                   activeDot={{ r: 5 }}
                 />
                 <ChartTooltip 
                   formatter={(value) => [`${value} agendamentos`, 'Quantidade']}
                   labelFormatter={(label) => `Horário: ${label}`}
                 />
               </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Performance por Profissional - Ocupa toda a largura e centralizado */}
      <Card className="bg-card border-border col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground text-center">
            Performance por Profissional
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ChartContainer config={chartConfig} className="h-[300px] w-full max-w-4xl">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData?.performanceData || []} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ 
                    value: 'Serviços\nRealizados', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Bar 
                  dataKey="agendamentos" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                  animationBegin={0}
                  animationEasing="ease-out"
                >
                  {chartData?.performanceData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                 <ChartTooltip 
                   formatter={(value) => [`${Math.floor(Number(value))} serviços`, 'Total']}
                   labelFormatter={(label) => `Profissional: ${label}`}
                 />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
