import { useAuthStore } from "@/store/useAuthStore";

export const GLOBAL_ENTITY_ID = useAuthStore.getState().entityId;
