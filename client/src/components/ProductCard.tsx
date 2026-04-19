import { ExternalLink, Star } from "lucide-react";
import type { SuggestedProduct } from "@shared/schema";

interface ProductCardProps {
  product: SuggestedProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group flex flex-col bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-xl hover:shadow-primary/5 hover:border-border transition-all duration-500 ease-out h-full">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary/50">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out mix-blend-multiply dark:mix-blend-normal"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <a 
          href={product.productLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-accent hover:text-white"
        >
          <ExternalLink size={18} />
        </a>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {product.storeName}
          </span>
          {product.rating && (
            <div className="flex items-center gap-1 text-accent">
              <Star size={12} className="fill-current" />
              <span className="text-xs font-semibold">{product.rating}</span>
            </div>
          )}
        </div>
        
        <h4 className="font-display font-medium text-lg leading-tight mb-2 group-hover:text-accent transition-colors line-clamp-2">
          {product.name}
        </h4>
        
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
          <span className="font-semibold text-lg">{product.price}</span>
          <a 
            href={product.productLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            {product.storeName === "Amazon" ? "View on Amazon" : "View Product"}
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
