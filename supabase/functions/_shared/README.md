# 🔧 Utilities Compartilhadas - Edge Functions

Esta pasta contém código reutilizável usado por todas as Edge Functions do projeto.

## 📦 Módulos Disponíveis

### **cors.ts** - CORS e Respostas HTTP
```typescript
import { corsHeaders, jsonResponse, errorResponse, handleCorsPreFlight } from '../_shared';

// Responder OPTIONS
if (req.method === "OPTIONS") return handleCorsPreFlight();

// Resposta de sucesso
return jsonResponse({ data: booking }, 200);

// Resposta de erro
return errorResponse("Erro ao processar", 400);
```

### **datetime.ts** - Data/Hora do Brasil
```typescript
import { getBrazilDateTime, getBrazilDateString, isDateInPast } from '../_shared';

// Data/hora atual do Brasil
const now = getBrazilDateTime();

// Apenas a data (YYYY-MM-DD)
const today = getBrazilDateString();

// Verificar se data é passado
if (isDateInPast(date)) {
  return errorResponse("Data no passado");
}
```

### **password.ts** - Geração de Senhas
```typescript
import { generatePassword, generateUniquePassword } from '../_shared';

// Gerar senha simples (4 dígitos)
const senha = generatePassword();

// Gerar senha única (consulta banco)
const senha = await generateUniquePassword(supabase);
```

### **validation.ts** - Validação de Dados
```typescript
import { validateBookingData, isValidDate, normalizeTime } from '../_shared';

// Validar dados de agendamento
const { valid, errors } = validateBookingData(body);
if (!valid) {
  return errorResponse(errors.join(', '), 400);
}

// Normalizar horário (adicionar :00 se necessário)
const time = normalizeTime(body.time);
```

---

## 🎯 Como Usar

### 1. Import simples (barrel export)
```typescript
import { 
  jsonResponse, 
  getBrazilDateTime, 
  generatePassword 
} from '../_shared';
```

### 2. Import específico
```typescript
import { corsHeaders } from '../_shared/cors.ts';
import { isValidDate } from '../_shared/validation.ts';
```

---

## ⚠️ Importante

- Esta pasta **NÃO é deployada** como Edge Function (começa com `_`)
- Todo código aqui deve ser **puro e reutilizável**
- **NÃO colocar lógica de negócio específica** aqui
- Apenas utilities genéricas

---

## 🔄 Próximos Passos

Agora que as utilities estão criadas, vamos **refatorar as Edge Functions** para usá-las:
- ✅ `book_slot`
- ✅ `cancel_booking`
- ✅ `reschedule_booking`
- ✅ `query_bookings`
- ✅ `get_available_slots`

Isso vai reduzir significativamente código duplicado! 🎉
```

**✅ COMMIT: "docs: adiciona README das utilities compartilhadas"**

---

## 🎯 **CHECKPOINT 3 - O QUE CONSEGUIMOS?**

✅ **Pasta `_shared/` criada** com utilities reutilizáveis
✅ **CORS centralizado** (não precisa mais duplicar em cada function)
✅ **Timezone do Brasil** (lógica centralizada)
✅ **Geração de senhas** (código único)
✅ **Validações** (padronizadas)
✅ **Documentação** (README explicando como usar)

---

## 📌 **RESUMO DOS COMMITS DA ETAPA 3:**
```
1. feat: adiciona utilities de CORS compartilhadas
2. feat: adiciona utilities de data/hora do Brasil
3. feat: adiciona utilities de geração de senhas
4. feat: adiciona utilities de validação de dados
5. feat: adiciona barrel export para utilities
6. docs: adiciona README das utilities compartilhadas
