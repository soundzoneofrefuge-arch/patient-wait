import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Map, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface StoreInfo {
  address: string | null;
  phone: string | null;
  maps_url: string | null;
  url_insta: string | null;
}

export default function ContactInfo() {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  useEffect(() => {
    async function loadStoreInfo() {
      const { data, error } = await supabase
        .from("info_loja")
        .select("address, phone, maps_url, url_insta")
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
        
        {(storeInfo.maps_url || storeInfo.url_insta) && (
          <div className="flex gap-2">
            {storeInfo.maps_url && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                onClick={() => {
                  let url = storeInfo.maps_url!;
                  if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                  }
                  window.open(url, '_blank');
                }}
              >
                <Map className="h-4 w-4 mr-2" />
                Google Maps
                <ExternalLink className="h-3 w-3 ml-2 opacity-50" />
              </Button>
            )}
            {storeInfo.url_insta && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-pink-500/30 hover:bg-pink-500/10 hover:border-pink-500/50"
                onClick={() => {
                  let url = storeInfo.url_insta!;
                  if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                  }
                  window.open(url, '_blank');
                }}
              >
                <svg 
                  className="h-4 w-4 mr-2" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
                <ExternalLink className="h-3 w-3 ml-2 opacity-50" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
