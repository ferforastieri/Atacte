import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'


import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import DashboardView from '@/views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { 
        requiresAuth: false,
        title: 'Login - Atacte'
      }
    },
    {
      path: '/register',
      name: 'Register',
      component: RegisterView,
      meta: { 
        requiresAuth: false,
        title: 'Registro - Atacte'
      }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: DashboardView,
      meta: { 
        requiresAuth: true,
        title: 'Dashboard - Atacte'
      }
    },
    {
      path: '/passwords/:id',
      name: 'PasswordDetail',
      component: () => import('@/views/passwords/PasswordDetailView.vue'),
      meta: { 
        requiresAuth: true,
        title: 'Detalhes da Senha - Atacte'
      }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/user/ProfileView.vue'),
      meta: { 
        requiresAuth: true,
        title: 'Perfil - Atacte'
      }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/user/SettingsView.vue'),
      meta: { 
        requiresAuth: true,
        title: 'Configurações - Atacte'
      }
    },
    {
      path: '/audit',
      name: 'AuditLogs',
      component: () => import('@/views/user/AuditLogsView.vue'),
      meta: { 
        requiresAuth: true,
        title: 'Logs de Auditoria - Atacte'
      }
    },
    {
      path: '/sessions',
      name: 'Sessions',
      component: () => import('@/views/user/SessionsView.vue'),
      meta: { 
        requiresAuth: true,
        title: 'Sessões - Atacte'
      }
    },
    {
      path: '/totp',
      name: 'Totp',
      component: () => import('@/views/totp/TotpView.vue'),
      meta: { 
        requiresAuth: true,
        title: 'Códigos TOTP - Atacte'
      }
    },
    {
      path: '/location',
      name: 'Location',
      component: () => import('@/views/LocationView.vue'),
      meta: { 
        requiresAuth: true,
        title: 'Localização - Atacte'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { 
        requiresAuth: false,
        title: 'Página não encontrada - Atacte'
      }
    }
  ]
})


router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }
    
    next()
  } else {
    
    if (authStore.isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
      next('/dashboard')
    } else {
      next()
    }
  }
})


router.onError((error) => {
  console.error('Router Error:', error)
})

export default router
