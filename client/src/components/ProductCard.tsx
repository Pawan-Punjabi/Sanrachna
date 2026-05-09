import { ExternalLink, Star } from "lucide-react";
import type { NormalisedProduct } from "@shared/schema";

interface ProductCardProps {
  product: NormalisedProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <a 
      href={product.productLink} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group block h-full"
    >
      <div className="flex flex-col bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500 ease-out h-full relative">
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-muted/30">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              img.onerror = null;
              img.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 bg-white/10 backdrop-blur-md px-2 py-1 rounded">
               {product.storeName}
             </span>
             <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                <ExternalLink size={14} />
             </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent/10 rounded-full">
              <Star size={10} className="fill-accent text-accent" />
              <span className="text-[11px] font-bold text-accent">{product.rating || "4.2"}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Furniture
            </span>
          </div>
          
          <h4 className="font-display font-semibold text-base leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h4>
          
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/40">
            <span className="font-display font-bold text-xl text-foreground">
              {product.price}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              View Details
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
