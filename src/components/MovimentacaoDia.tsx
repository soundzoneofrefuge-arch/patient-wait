import { useState, useEffect, CSSProperties } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MovementData {
  date: string;
  total: number;
  byHour: Record<string, number>;
}

const MovimentacaoDia = () => {
  const [data, setData] = useState<MovementData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovement = async () => {
      try {
        const { data: response, error } = await supabase.functions.invoke('get-day-movement');
        
        if (error) {
          console.error('Erro ao buscar movimentação:', error);
          return;
        }
        
        console.log('MovimentacaoDia data:', response);
        setData(response);
      } catch (err) {
        console.error('Erro inesperado:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovement();
  }, []);

  const getMovementLevel = (total: number) => {
    if (total <= 3) return { label: "Pouco movimento", color: "text-green-400", bg: "bg-green-500/20", icon: TrendingDown };
    if (total <= 8) return { label: "Movimento moderado", color: "text-yellow-400", bg: "bg-yellow-500/20", icon: Minus };
    return { label: "Muito movimento", color: "text-red-400", bg: "bg-red-500/20", icon: TrendingUp };
  };

  const movement = data ? getMovementLevel(data.total) : null;
  const MovementIcon = movement?.icon || Minus;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Scissors className="h-5 w-5 text-primary" />
          Movimentação do Dia
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Acompanhe a quantidade de agendamentos
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="relative">
            {/* Barbershop SVG Illustration */}
            <svg viewBox="0 0 300 250" className="w-full h-48">
              {/* Background - Floor */}
              <rect x="0" y="200" width="300" height="50" fill="#1a1a1a" />
              <rect x="0" y="200" width="300" height="3" fill="#333" />
              
              {/* Floor tiles pattern */}
              {[0, 60, 120, 180, 240].map((x, i) => (
                <rect key={i} x={x} y="205" width="55" height="40" fill={i % 2 === 0 ? "#222" : "#1a1a1a"} stroke="#333" strokeWidth="0.5" />
              ))}
              
              {/* Wall */}
              <rect x="0" y="0" width="300" height="200" fill="#2a2a2a" />
              
              {/* Wainscoting */}
              <rect x="0" y="140" width="300" height="60" fill="#1f1f1f" />
              <rect x="0" y="140" width="300" height="3" fill="#444" />
              
              {/* Left Barber Pole - White, Blue, Red */}
              <g>
                <rect x="20" y="60" width="12" height="100" fill="#ddd" rx="2" />
                <defs>
                  <pattern id="barberStripe" patternUnits="userSpaceOnUse" width="12" height="24">
                    <rect width="12" height="8" fill="white" />
                    <rect y="8" width="12" height="8" fill="#1e40af" />
                    <rect y="16" width="12" height="8" fill="#dc2626" />
                  </pattern>
                </defs>
                <rect x="20" y="60" width="12" height="100" fill="url(#barberStripe)" rx="2">
                  <animate attributeName="y" values="60;52;60" dur="2s" repeatCount="indefinite" />
                </rect>
                <ellipse cx="26" cy="58" rx="8" ry="4" fill="#c0c0c0" />
                <ellipse cx="26" cy="162" rx="8" ry="4" fill="#c0c0c0" />
              </g>
              
              {/* Right Barber Pole - White, Blue, Red */}
              <g>
                <rect x="268" y="60" width="12" height="100" fill="#ddd" rx="2" />
                <rect x="268" y="60" width="12" height="100" fill="url(#barberStripe)" rx="2">
                  <animate attributeName="y" values="60;52;60" dur="2s" repeatCount="indefinite" />
                </rect>
                <ellipse cx="274" cy="58" rx="8" ry="4" fill="#c0c0c0" />
                <ellipse cx="274" cy="162" rx="8" ry="4" fill="#c0c0c0" />
              </g>
              
              {/* Left Mirror */}
              <rect x="55" y="50" width="40" height="55" rx="3" fill="#4a5568" stroke="#718096" strokeWidth="2" />
              <rect x="58" y="53" width="34" height="49" rx="2" fill="#1a202c" opacity="0.8" />
              <rect x="60" y="55" width="8" height="20" rx="1" fill="white" opacity="0.1" />
              
              {/* Right Mirror */}
              <rect x="205" y="50" width="40" height="55" rx="3" fill="#4a5568" stroke="#718096" strokeWidth="2" />
              <rect x="208" y="53" width="34" height="49" rx="2" fill="#1a202c" opacity="0.8" />
              <rect x="210" y="55" width="8" height="20" rx="1" fill="white" opacity="0.1" />
              
              {/* Left Barber Chair - Classic Red */}
              <g>
                {/* Chair base */}
                <ellipse cx="75" cy="195" rx="20" ry="5" fill="#333" />
                <rect x="70" y="175" width="10" height="20" fill="#555" />
                {/* Hydraulic cylinder */}
                <rect x="72" y="160" width="6" height="18" fill="#666" />
                {/* Seat */}
                <path d="M50 140 Q50 160 55 165 L95 165 Q100 160 100 140 Z" fill="#b91c1c" />
                <path d="M52 142 Q52 158 56 162 L94 162 Q98 158 98 142 Z" fill="#dc2626" />
                {/* Seat cushion highlight */}
                <ellipse cx="75" cy="150" rx="18" ry="8" fill="#ef4444" opacity="0.5" />
                {/* Backrest */}
                <path d="M55 140 Q50 100 55 80 L95 80 Q100 100 95 140 Z" fill="#b91c1c" />
                <path d="M58 138 Q54 102 58 84 L92 84 Q96 102 92 138 Z" fill="#dc2626" />
                {/* Backrest highlight */}
                <rect x="60" y="90" width="8" height="40" rx="4" fill="#ef4444" opacity="0.3" />
                {/* Armrests */}
                <rect x="45" y="140" width="12" height="8" rx="3" fill="#444" />
                <rect x="93" y="140" width="12" height="8" rx="3" fill="#444" />
                {/* Headrest */}
                <ellipse cx="75" cy="75" rx="12" ry="8" fill="#dc2626" />
                {/* Chrome details */}
                <rect x="48" y="165" width="54" height="4" rx="2" fill="#888" />
              </g>
              
              {/* Right Barber Chair - Classic Red */}
              <g>
                {/* Chair base */}
                <ellipse cx="225" cy="195" rx="20" ry="5" fill="#333" />
                <rect x="220" y="175" width="10" height="20" fill="#555" />
                {/* Hydraulic cylinder */}
                <rect x="222" y="160" width="6" height="18" fill="#666" />
                {/* Seat */}
                <path d="M200 140 Q200 160 205 165 L245 165 Q250 160 250 140 Z" fill="#b91c1c" />
                <path d="M202 142 Q202 158 206 162 L244 162 Q248 158 248 142 Z" fill="#dc2626" />
                {/* Seat cushion highlight */}
                <ellipse cx="225" cy="150" rx="18" ry="8" fill="#ef4444" opacity="0.5" />
                {/* Backrest */}
                <path d="M205 140 Q200 100 205 80 L245 80 Q250 100 245 140 Z" fill="#b91c1c" />
                <path d="M208 138 Q204 102 208 84 L242 84 Q246 102 242 138 Z" fill="#dc2626" />
                {/* Backrest highlight */}
                <rect x="210" y="90" width="8" height="40" rx="4" fill="#ef4444" opacity="0.3" />
                {/* Armrests */}
                <rect x="195" y="140" width="12" height="8" rx="3" fill="#444" />
                <rect x="243" y="140" width="12" height="8" rx="3" fill="#444" />
                {/* Headrest */}
                <ellipse cx="225" cy="75" rx="12" ry="8" fill="#dc2626" />
                {/* Chrome details */}
                <rect x="198" y="165" width="54" height="4" rx="2" fill="#888" />
              </g>
              
              {/* Left Barber (standing) */}
              <g>
                {/* Body */}
                <ellipse cx="95" cy="125" rx="10" ry="15" fill="#374151" />
                {/* Apron */}
                <path d="M87 120 L87 138 L103 138 L103 120 Z" fill="white" opacity="0.9" />
                {/* Head */}
                <circle cx="95" cy="105" r="10" fill="#fbbf24" />
                {/* Hair */}
                <path d="M87 100 Q95 92 103 100" fill="#1f2937" stroke="#1f2937" strokeWidth="3" />
                {/* Face */}
                <circle cx="92" cy="104" r="1.5" fill="#1f2937" />
                <circle cx="98" cy="104" r="1.5" fill="#1f2937" />
                <path d="M93 109 Q95 111 97 109" stroke="#1f2937" strokeWidth="1" fill="none" />
                {/* Arm with scissors */}
                <line x1="103" y1="120" x2="112" y2="115" stroke="#fbbf24" strokeWidth="3" />
                <path d="M112 112 L118 108 M112 118 L118 122" stroke="#888" strokeWidth="2" />
              </g>
              
              {/* Right Barber (standing) */}
              <g>
                {/* Body */}
                <ellipse cx="205" cy="125" rx="10" ry="15" fill="#374151" />
                {/* Apron */}
                <path d="M197 120 L197 138 L213 138 L213 120 Z" fill="white" opacity="0.9" />
                {/* Head */}
                <circle cx="205" cy="105" r="10" fill="#92400e" />
                {/* Hair */}
                <ellipse cx="205" cy="97" rx="8" ry="4" fill="#1f2937" />
                {/* Face */}
                <circle cx="202" cy="104" r="1.5" fill="#1f2937" />
                <circle cx="208" cy="104" r="1.5" fill="#1f2937" />
                <path d="M203 109 Q205 111 207 109" stroke="#1f2937" strokeWidth="1" fill="none" />
                {/* Arm with comb */}
                <line x1="197" y1="120" x2="188" y2="115" stroke="#92400e" strokeWidth="3" />
                <rect x="182" y="112" width="8" height="3" rx="1" fill="#333" />
              </g>
              
              {/* Waiting bench in center */}
              <g>
                {/* Bench seat */}
                <rect x="125" y="180" width="50" height="10" rx="2" fill="#854d0e" />
                <rect x="127" y="182" width="46" height="6" rx="1" fill="#a16207" />
                {/* Bench legs */}
                <rect x="130" y="190" width="6" height="12" fill="#713f12" />
                <rect x="164" y="190" width="6" height="12" fill="#713f12" />
                {/* Bench back */}
                <rect x="125" y="165" width="50" height="18" rx="2" fill="#854d0e" />
                <rect x="127" y="167" width="46" height="14" rx="1" fill="#a16207" />
              </g>
              
              {/* Among Us style animated clients */}
              {/* Client 1 - Orange */}
              <g className="animate-bounce" style={{ animationDuration: '2s', animationDelay: '0s' } as CSSProperties}>
                <ellipse cx="135" cy="178" rx="8" ry="12" fill="#f97316" />
                <ellipse cx="139" cy="174" rx="5" ry="3.5" fill="#87CEEB" opacity="0.9" />
                <ellipse cx="140" cy="173" rx="2" ry="1.2" fill="white" opacity="0.5" />
                <rect x="124" y="170" width="4" height="10" rx="1.5" fill="#ea580c" />
                <ellipse cx="132" cy="189" rx="3" ry="2" fill="#f97316" />
                <ellipse cx="138" cy="189" rx="3" ry="2" fill="#f97316" />
              </g>
              
              {/* Client 2 - Cyan */}
              <g className="animate-bounce" style={{ animationDuration: '2.2s', animationDelay: '0.3s' } as CSSProperties}>
                <ellipse cx="150" cy="178" rx="8" ry="12" fill="#06b6d4" />
                <ellipse cx="154" cy="174" rx="5" ry="3.5" fill="#87CEEB" opacity="0.9" />
                <ellipse cx="155" cy="173" rx="2" ry="1.2" fill="white" opacity="0.5" />
                <rect x="139" y="170" width="4" height="10" rx="1.5" fill="#0891b2" />
                <ellipse cx="147" cy="189" rx="3" ry="2" fill="#06b6d4" />
                <ellipse cx="153" cy="189" rx="3" ry="2" fill="#06b6d4" />
              </g>
              
              {/* Client 3 - Lime */}
              <g className="animate-bounce" style={{ animationDuration: '1.8s', animationDelay: '0.6s' } as CSSProperties}>
                <ellipse cx="165" cy="178" rx="8" ry="12" fill="#84cc16" />
                <ellipse cx="169" cy="174" rx="5" ry="3.5" fill="#87CEEB" opacity="0.9" />
                <ellipse cx="170" cy="173" rx="2" ry="1.2" fill="white" opacity="0.5" />
                <rect x="154" y="170" width="4" height="10" rx="1.5" fill="#65a30d" />
                <ellipse cx="162" cy="189" rx="3" ry="2" fill="#84cc16" />
                <ellipse cx="168" cy="189" rx="3" ry="2" fill="#84cc16" />
              </g>
              
              {/* Decorative elements */}
              {/* Shelf with products */}
              <rect x="120" y="45" width="60" height="6" fill="#444" />
              <rect x="125" y="35" width="10" height="12" rx="2" fill="#3b82f6" />
              <rect x="140" y="38" width="8" height="9" rx="2" fill="#10b981" />
              <rect x="155" y="36" width="12" height="11" rx="2" fill="#f59e0b" />
              
              {/* Clock */}
              <circle cx="150" cy="25" r="12" fill="#333" stroke="#555" strokeWidth="2" />
              <circle cx="150" cy="25" r="9" fill="#1a1a1a" />
              <line x1="150" y1="25" x2="150" y2="18" stroke="white" strokeWidth="1.5" />
              <line x1="150" y1="25" x2="155" y2="28" stroke="white" strokeWidth="1" />
            </svg>
            
            {/* Movement badge - positioned bottom right, below SVG */}
            {movement && (
              <div className="flex justify-end mt-1">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${movement.bg} border border-current/20 shadow-lg`}>
                  <MovementIcon className={`h-3.5 w-3.5 ${movement.color}`} />
                  <span className={`text-xs font-medium ${movement.color}`}>{movement.label}</span>
                </div>
              </div>
            )}
            
            {/* Stats footer */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-border/30">
              <span className="text-2xl font-bold text-primary">{data?.total || 0}</span>
              <span className="text-sm text-muted-foreground">agendamentos hoje</span>
            </div>
            
            {/* Popular hours bar chart */}
            {data?.byHour && Object.keys(data.byHour).length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Horários mais procurados:</p>
                <div className="flex items-end gap-1 h-12">
                  {Array.from({ length: 12 }, (_, i) => {
                    const hour = (9 + i).toString();
                    const count = data.byHour[hour] || 0;
                    const maxCount = Math.max(...Object.values(data.byHour), 1);
                    const height = count > 0 ? Math.max((count / maxCount) * 100, 15) : 8;
                    
                    return (
                      <div key={hour} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className={`w-full rounded-t transition-all duration-500 ${count > 0 ? 'bg-primary' : 'bg-muted/30'}`}
                          style={{ height: `${height}%` }}
                          title={`${hour}h: ${count} agendamentos`}
                        />
                        <span className="text-[9px] text-muted-foreground">{9 + i}h</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MovimentacaoDia;
