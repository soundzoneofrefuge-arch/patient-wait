import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Map, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface StoreInfo {
  address: string | null;
  phone: string | null;
  maps_url: string | null;
}

export default function ContactInfo() {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  useEffect(() => {
    async function loadStoreInfo() {
      const { data, error } = await supabase
        .from("info_loja")
        .select("address, phone, maps_url")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setStoreInfo(data);
      }
    }

    loadStoreInfo();
  }, []);

  if (!storeInfo) return null;

  return (
    <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          Informações de Contato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {storeInfo.address && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Endereço</p>
              <p className="text-sm text-foreground">{storeInfo.address}</p>
            </div>
          </div>
        )}
        
        {storeInfo.phone && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="p-2 rounded-lg bg-success/10 border border-success/20">
              <Phone className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Telefone</p>
              <a 
                href={`tel:${storeInfo.phone.replace(/\D/g, '')}`}
                className="text-sm text-foreground hover:text-primary transition-colors font-medium"
              >
                {storeInfo.phone}
              </a>
            </div>
          </div>
        )}
        
        {storeInfo.maps_url && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary/50"
            onClick={() => {
              let url = storeInfo.maps_url!;
              // Garante que a URL tenha protocolo
              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
              }
              window.open(url, '_blank');
            }}
          >
            <Map className="h-4 w-4 mr-2" />
            Ver no Google Maps
            <ExternalLink className="h-3 w-3 ml-2 opacity-50" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
