import { useState } from "react";
import { SlidersHorizontal, X, Check } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Slider from "@radix-ui/react-slider";
import { motion, AnimatePresence } from "framer-motion";

interface ProductFilterProps {
  minPrice: number;
  maxPrice: number;
  onFilterChange: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export interface FilterState {
  priceRange: [number, number];
  sortBy: "relevance" | "price-asc" | "price-desc" | "rating";
}

export function ProductFilter({ minPrice, maxPrice, onFilterChange, currentFilters }: ProductFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterState>(currentFilters);

  const handleApply = () => {
    onFilterChange(tempFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultFilters: FilterState = {
      priceRange: [minPrice, maxPrice],
      sortBy: "relevance"
    };
    setTempFilters(defaultFilters);
    onFilterChange(defaultFilters);
    setIsOpen(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background hover:bg-muted transition-all text-sm font-medium shadow-sm">
          <SlidersHorizontal size={16} />
          Filters
          {(currentFilters.sortBy !== "relevance" || currentFilters.priceRange[0] !== minPrice || currentFilters.priceRange[1] !== maxPrice) && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-300" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl z-[51] overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
            <div>
              <Dialog.Title className="text-xl font-display font-bold">Refine Results</Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-1">Adjust filters to find exactly what you need</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-8 space-y-10">
            {/* Price Range */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/70">Price Range</h4>
                <span className="text-sm font-mono font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
                  ₹{tempFilters.priceRange[0].toLocaleString()} - ₹{tempFilters.priceRange[1].toLocaleString()}
                </span>
              </div>
              
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={tempFilters.priceRange}
                min={minPrice}
                max={maxPrice}
                step={500}
                onValueChange={(val) => setTempFilters({ ...tempFilters, priceRange: val as [number, number] })}
              >
                <Slider.Track className="bg-muted relative grow rounded-full h-1.5">
                  <Slider.Range className="absolute bg-primary rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-primary shadow-lg rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-primary shadow-lg rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </Slider.Root>
              
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                <span>Min: ₹{minPrice.toLocaleString()}</span>
                <span>Max: ₹{maxPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Sort By */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/70">Sort By</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "relevance", label: "Relevance" },
                  { id: "price-asc", label: "Price: Low to High" },
                  { id: "price-desc", label: "Price: High to Low" },
                  { id: "rating", label: "Top Rated" }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setTempFilters({ ...tempFilters, sortBy: option.id as any })}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      tempFilters.sortBy === option.id 
                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                        : "bg-background border-border hover:border-primary/30 hover:bg-muted"
                    }`}
                  >
                    {option.label}
                    {tempFilters.sortBy === option.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-muted/30 border-t border-border flex items-center gap-3">
            <button 
              onClick={handleReset}
              className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset All
            </button>
            <button 
              onClick={handleApply}
              className="flex-[2] bg-foreground text-background px-4 py-3 rounded-2xl text-sm font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Apply Filters
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
