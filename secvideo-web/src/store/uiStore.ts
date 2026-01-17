import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  // Sidebar
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;

  // Mobile
  isMobileMenuOpen: boolean;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown> | null;

  // Toasts
  toasts: Toast[];

  // Theme
  theme: 'dark' | 'light';

  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;
}

interface UIActions {
  // Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Mobile
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;

  // Modals
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Toasts
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Theme
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  // Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  isSidebarOpen: true,
  isSidebarCollapsed: false,
  isMobileMenuOpen: false,
  activeModal: null,
  modalData: null,
  toasts: [],
  theme: 'dark',
  globalLoading: false,
  loadingMessage: null,
};

export const useUIStore = create<UIStore>((set, get) => ({
  ...initialState,

  // Sidebar
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),

  setSidebarCollapsed: (collapsed: boolean) => set({ isSidebarCollapsed: collapsed }),

  // Mobile
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  setMobileMenuOpen: (open: boolean) => set({ isMobileMenuOpen: open }),

  // Modals
  openModal: (modalId: string, data?: Record<string, unknown>) => {
    set({ activeModal: modalId, modalData: data || null });
  },

  closeModal: () => set({ activeModal: null, modalData: null }),

  // Toasts
  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto-remove toast after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => set({ toasts: [] }),

  // Theme
  setTheme: (theme: 'dark' | 'light') => {
    set({ theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },

  // Loading
  setGlobalLoading: (loading: boolean, message?: string) => {
    set({ globalLoading: loading, loadingMessage: message || null });
  },
}));

// Helper hook for toasts
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);

  return {
    success: (message: string) => addToast({ type: 'success', message }),
    error: (message: string) => addToast({ type: 'error', message }),
    warning: (message: string) => addToast({ type: 'warning', message }),
    info: (message: string) => addToast({ type: 'info', message }),
  };
};

// Selectors
export const selectIsSidebarOpen = (state: UIStore) => state.isSidebarOpen;
export const selectActiveModal = (state: UIStore) => state.activeModal;
export const selectToasts = (state: UIStore) => state.toasts;

