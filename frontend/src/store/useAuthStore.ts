import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { StateCreator } from 'zustand';
import { usePickListStore } from './usePickListStore';
interface AuthState {
  isAuthenticated: boolean;
  entityId: string | null;
  username: string | null;
  entityType: string | null;
  login: (userData: { entity_id: string; username: string; entity_type: string }) => void;
  logout: () => void;
}

type AuthStore = AuthState;
type AuthPersist = Pick<AuthState, 'isAuthenticated' | 'entityId' | 'username' | 'entityType'>;

const createAuthSlice: StateCreator<
  AuthStore,
  [],
  [['zustand/persist', AuthPersist]]
> = (set) => ({
  isAuthenticated: false,
  entityId: null,
  username: null,
  entityType: null,
  login: (userData: { entity_id: string; username: string; entity_type: string }) => {
    set({
      isAuthenticated: true,
      entityId: userData.entity_id,
      username: userData.username,
      entityType: userData.entity_type,
    });
      window.location.reload();

  },
  logout: async() => {
  const { resetPickList } = usePickListStore.getState();
  await resetPickList();
  window.location.reload();
  set({
    isAuthenticated: false,
    entityId: null,
    username: null,
    entityType: null,
  });
}
    
});

export const useAuthStore = create<AuthStore>()(
  persist(createAuthSlice, {
    name: 'auth-storage',
    partialize: (state) => ({
      isAuthenticated: state.isAuthenticated,
      entityId: state.entityId,
      username: state.username,
      entityType: state.entityType,
    }),
  })
);
