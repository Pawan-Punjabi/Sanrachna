import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { FloorPlanWithDetails, UploadResponse } from "@shared/schema";

export function useFloorPlans() {
  return useQuery({
    queryKey: [api.floorPlans.list.path],
    queryFn: async () => {
      const res = await fetch(api.floorPlans.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch floor plans");
      // Coerce the response structure
      const data = await res.json();
      return data as FloorPlanWithDetails[];
    },
  });
}

export function useFloorPlan(id: number) {
  return useQuery({
    queryKey: [api.floorPlans.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.floorPlans.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch floor plan details");
      const data = await res.json();
      return data as FloorPlanWithDetails;
    },
    enabled: !!id,
  });
}

export function useUploadFloorPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const res = await fetch(api.floorPlans.upload.path, {
        method: api.floorPlans.upload.method,
        body: formData,
        credentials: "include",
        // Do NOT set Content-Type header; browser sets it automatically with boundary for FormData
      });
      
      if (!res.ok) {
        let errorMsg = "Failed to upload floor plan";
        try {
          const errData = await res.json();
          if (errData.message) errorMsg = errData.message;
        } catch (_) {}
        throw new Error(errorMsg);
      }
      
      const data = await res.json();
      return data as UploadResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.floorPlans.list.path] });
    },
  });
}

export function useDeleteFloorPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.floorPlans.delete.path, { id });
      const res = await fetch(url, { 
        method: api.floorPlans.delete.method,
        credentials: "include" 
      });
      
      if (!res.ok) throw new Error("Failed to delete floor plan");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.floorPlans.list.path] });
    },
  });
}
