import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Map } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
    <Card className="bg-card/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center text-lg">Informações de Contato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {storeInfo.address && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">{storeInfo.address}</p>
          </div>
        )}
        
        {storeInfo.phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary flex-shrink-0" />
            <a 
              href={`tel:${storeInfo.phone.replace(/\D/g, '')}`}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {storeInfo.phone}
            </a>
          </div>
        )}
        
        {storeInfo.maps_url && (
          <div className="flex items-center gap-3">
            <Map className="h-5 w-5 text-primary flex-shrink-0" />
            <a 
              href={storeInfo.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Ver no Google Maps
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
