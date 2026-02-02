
# Plano Ultra Otimizado: Sistema de Horários com ~7 Queries por Sessão

## Resumo Executivo

Otimização do sistema de agendamento para reduzir o consumo de requisições do Supabase de **~100+ queries/sessão** para **~7-10 queries/sessão**, permitindo suportar facilmente **50-100 usuários/mês** (e até ~71.000 no limite teórico).

---

## Análise do Sistema Atual

### Fluxo Atual (Ineficiente)
```text
Usuário entra no site
       |
       v
+---------------------------+
| fetchAllSlots() dispara   |
| 6 chamadas paralelas      |
| (1 por data)              |
+---------------------------+
       |
       v
+---------------------------+
| Cada chamada executa:     |
| - horarios_especiais      |
| - feriados                |
| - info_loja (REMOVER)     |
| - agendamentos_robustos   |
+---------------------------+
       |
       v
= 24 queries apenas na entrada
```

### Problemas Identificados
1. **Linha 197-244 (Booking.tsx)**: `fetchAllSlots()` busca 6 datas simultaneamente
2. **Linha 284-301 (Booking.tsx)**: Realtime dispara `fetchAllSlots()` novamente (mais 24 queries)
3. **Linha 263-281 (Booking.tsx)**: `fetchSlotsForProfessional()` busca para TODOS os profissionais
4. **Edge Function**: Query `info_loja` é redundante (já carregada no frontend)

---

## Novo Fluxo Proposto

```text
Usuário entra no site
       |
       v
+---------------------------+
| Mostrar 6 datas como      |
| CARDS CLICÁVEIS           |
| (0 queries de slots)      |
+---------------------------+
       |
       v
Usuário clica em uma data
       |
       v
+---------------------------+
| fetchSlotsFor(data)       |
| APENAS 1 chamada          |
| = 3 queries no banco      |
+---------------------------+
       |
       v
+---------------------------+
| Realtime monitora APENAS  |
| a data selecionada        |
| (debounce de 1.5s)        |
+---------------------------+
       |
       v
Usuário clica em AGENDAR
       |
       v
+---------------------------+
| book-slot verifica        |
| conflito antes de inserir |
| = 3 queries               |
+---------------------------+
```

---

## Mudanças Detalhadas

### 1. Edge Function `get-available-slots` (3 queries)

**Remover**: Query de `info_loja` (horários de funcionamento)

**Manter**:
- `horarios_especiais` (verificar fechamento/horário especial)
- `feriados` (verificar feriado)
- `agendamentos_robustos` (slots ocupados)

**Nova lógica**:
- Receber `opening_time`, `closing_time`, `slot_interval_minutes` como parâmetros opcionais do frontend
- Se horário especial existir, sobrescrever os parâmetros recebidos

### 2. Booking.tsx - Interface de Datas

**Substituir calendário popup por 6 cards clicáveis**:
- Cada card mostra: dia da semana, data formatada
- Ao clicar: busca slots APENAS daquela data
- Visual: card selecionado fica destacado (ring + cor)

**Novo estado**:
```typescript
const [selectedDateCard, setSelectedDateCard] = useState<string | null>(null);
const [slotsForSelectedDate, setSlotsForSelectedDate] = useState<string[]>([]);
const [specialInfo, setSpecialInfo] = useState<SpecialInfo | null>(null);
```

### 3. Booking.tsx - Realtime Otimizado com Debounce

**Lógica de debounce**:
```typescript
// Quando Realtime detecta mudança:
// 1. Cancelar timer anterior (se existir)
// 2. Iniciar novo timer de 1.5 segundos
// 3. Após 1.5s, atualizar APENAS a data selecionada
```

**Por que 1.5 segundos?**
- Rápido o suficiente para o usuário ver a atualização
- Agrupa múltiplos eventos (ex: 3 pessoas agendando em sequência)
- Evita requisições desnecessárias durante picos

### 4. Mensagens de Erro e Validação

**No clique de horário**:
- Se horário já foi ocupado (Realtime atualizou), mostrar toast de erro
- Limpar seleção e forçar nova escolha

**No clique de AGENDAR**:
- Edge function `book-slot` já valida conflito (linha 44-63)
- Se conflito detectado (409), mostrar mensagem clara:
  - "Este horário foi reservado por outra pessoa. Atualizando horários..."
  - Recarregar slots automaticamente
  - Limpar seleção de horário

**Cenários de erro tratados**:
1. Horário ocupado durante seleção
2. Conflito no momento de confirmar
3. Loja fechada / Feriado
4. Data inválida (passada)

### 5. Reschedule.tsx - Mesmas Otimizações

Aplicar exatamente a mesma lógica:
- Cards clicáveis ao invés de buscar 6 datas
- Realtime apenas na data selecionada
- Debounce de 1.5s
- Mensagens de erro claras

---

## Contagem Final de Queries

| Ação | Queries |
|------|---------|
| Entrar no site | 0 (slots) + 1 (info_loja config) = **1** |
| Selecionar data | **3** |
| Realtime (por evento) | **3** (com debounce, raramente dispara) |
| Clicar AGENDAR | **3** (book-slot) |
| **TOTAL por sessão** | **~7-10** |

---

## Capacidade do Plano Free

| Métrica | Valor |
|---------|-------|
| Limite mensal Supabase | 500.000 requests |
| Queries por sessão | ~10 |
| Usuários suportados | ~50.000/mês |
| Sua meta (50-100) | **Muito abaixo do limite** |

---

## Arquivos a Modificar

1. `supabase/functions/get-available-slots/index.ts`
   - Remover query de `info_loja`
   - Aceitar parâmetros de horário opcionais

2. `src/pages/Booking.tsx`
   - Substituir calendário por cards de data
   - Implementar busca sob demanda
   - Adicionar debounce no Realtime
   - Melhorar mensagens de erro

3. `src/pages/Reschedule.tsx`
   - Aplicar mesmas mudanças do Booking.tsx

---

## Seção Técnica

### Implementação do Debounce (Realtime)

```typescript
// Referência para o timer
const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

// No useEffect do Realtime
useEffect(() => {
  if (!config || !selectedDateCard) return;
  
  const channel = supabase
    .channel("booking-slots")
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "agendamentos_robustos"
    }, (payload) => {
      // Verificar se a mudança afeta a data selecionada
      if (payload.new?.DATA === selectedDateCard || 
          payload.old?.DATA === selectedDateCard) {
        
        // Cancelar timer anterior
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        
        // Novo timer de 1.5s
        debounceTimerRef.current = setTimeout(() => {
          fetchSlotsFor(selectedDateCard);
        }, 1500);
      }
    })
    .subscribe();

  return () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    supabase.removeChannel(channel);
  };
}, [config, selectedDateCard, professional]);
```

### Estrutura dos Cards de Data

```typescript
<div className="grid grid-cols-3 md:grid-cols-6 gap-3">
  {nextSixDates.map(d => {
    const dateObj = new Date(d + 'T12:00:00');
    const isSelected = selectedDateCard === d;
    
    return (
      <Card
        key={d}
        className={cn(
          "cursor-pointer transition-all hover:border-primary/50",
          isSelected && "ring-2 ring-primary border-primary"
        )}
        onClick={() => handleDateCardClick(d)}
      >
        <CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">
            {format(dateObj, "EEE", { locale: ptBR })}
          </p>
          <p className="text-lg font-bold">
            {format(dateObj, "dd", { locale: ptBR })}
          </p>
          <p className="text-xs">
            {format(dateObj, "MMM", { locale: ptBR })}
          </p>
        </CardContent>
      </Card>
    );
  })}
</div>
```

### Tratamento de Conflito no Agendamento

```typescript
async function handleBook() {
  // ... validações existentes ...
  
  try {
    const { data, error } = await supabase.functions.invoke("book-slot", {
      body: { date, time, name, contact, professional, service }
    });
    
    if (error) throw error;
    
    // Sucesso - redirecionar
    navigate("/booking-confirmation", { state: {...} });
    
  } catch (e: any) {
    // Conflito de horário (409)
    if (e?.message?.includes("já possui agendamento") || 
        e?.context?.status === 409) {
      toast.error(
        "Este horário foi reservado por outra pessoa. Atualizando horários disponíveis...",
        { duration: 5000 }
      );
      
      // Limpar seleção
      setSelectedSlot(null);
      
      // Recarregar slots da data selecionada
      if (selectedDateCard) {
        await fetchSlotsFor(selectedDateCard);
      }
      return;
    }
    
    // Outros erros
    toast.error(e?.message || "Erro ao confirmar agendamento.");
  }
}
```
