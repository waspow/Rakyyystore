<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import Password from 'primevue/password'
import {useToast} from 'primevue/usetoast'
import axios from 'axios'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Toast from 'primevue/toast'

const username = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()
const toast = useToast()

const showError = (message) => {
  toast.add({
    severity: 'error',
    summary: '登录失败',
    detail: message,
    life: 4000
  })
}

const showSuccess = (message) => {
  toast.add({
    severity: 'success',
    summary: '登录成功',
    detail: message,
    life: 2000
  })
}

const handleSubmit = async () => {
  if (!username.value.trim() || !password.value.trim()) {
    showError('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    const response = await axios.post('http://127.0.0.1:8000/login', {
      username: username.value,
      password: password.value
    })

    // 登录成功
    showSuccess('登录成功，正在跳转...')
    localStorage.setItem('token', 'fake-token') // 你可以存真实返回的token
    setTimeout(async () => {
      await router.push({name: 'mainviewer'})
    }, 1000)
  } catch (err) {
    if (err.response && err.response.status === 401) {
      showError('用户名或密码错误，请重新输入')
    } else {
      showError('网络连接失败，请检查网络后重试')
    }
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <Toast position="top-center"/>

    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <div class="card-header">
        <div class="logo-container">
          <div class="logo-icon">
            <i class="pi pi-globe"></i>
          </div>
          <h1 class="app-title">Argo 数据系统</h1>
          <p class="app-subtitle">海洋浮标观测数据管理平台</p>
        </div>
      </div>

      <div class="card-body">
        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label for="username" class="form-label">
              <i class="pi pi-user"></i>
              用户名
            </label>
            <InputText
                id="username"
                v-model="username"
                placeholder="请输入您的用户名"
                class="form-input"
                :class="{ 'error': !username.trim() && loading }"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">
              <i class="pi pi-lock"></i>
              密码
            </label>
            <Password
                id="password"
                v-model="password"
                placeholder="请输入您的密码"
                toggleMask
                :feedback="false"
                class="form-password"
                :class="{ 'error': !password.trim() && loading }"
            />
          </div>

          <Button
              type="submit"
              :loading="loading"
              class="login-button"
              :disabled="!username.trim() || !password.trim()"
          >
            <template #default>
              <i class="pi pi-sign-in"></i>
              登录系统
            </template>
            <template #loading>
              <i class="pi pi-spin pi-spinner"></i>
              登录中...
            </template>
          </Button>
        </form>

        <div class="register-link">
          <span class="register-text">还没有账号？</span>
          <router-link to="/signinview" class="register-button">
            立即注册
            <i class="pi pi-arrow-right"></i>
          </router-link>
        </div>
      </div>
    </div>

    <!-- 页脚信息 -->
    <div class="footer">
      <p>&copy; 2024 Argo 数据系统. 海洋观测数据管理平台</p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 10%;
  animation-delay: 2s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* 登录卡片 */
.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  overflow: hidden;
  position: relative;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 30px;
  text-align: center;
  color: white;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.app-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-subtitle {
  font-size: 1rem;
  margin: 0;
  opacity: 0.9;
  font-weight: 300;
}

.card-body {
  padding: 40px 30px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.form-label i {
  color: #667eea;
  font-size: 1rem;
}

.form-input,
:deep(.form-password .p-password-input) {
  padding: 15px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #f9fafb;
}

.form-input:focus,
:deep(.form-password .p-password-input:focus) {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  outline: none;
}

.form-input.error,
:deep(.form-password.error .p-password-input) {
  border-color: #ef4444;
  background: #fef2f2;
}

:deep(.form-password .p-password) {
  width: 100%;
}

:deep(.form-password .p-password-input) {
  width: 100%;
}

.login-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 15px 30px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-button i {
  font-size: 1.2rem;
}

.register-link {
  margin-top: 30px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.register-text {
  color: #6b7280;
  font-size: 0.95rem;
}

.register-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  margin-left: 8px;
  transition: all 0.3s ease;
}

.register-button:hover {
  color: #764ba2;
  transform: translateX(3px);
}

.footer {
  margin-top: 30px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  position: relative;
  z-index: 2;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    margin: 10px;
    border-radius: 15px;
  }

  .card-header {
    padding: 30px 20px;
  }

  .card-body {
    padding: 30px 20px;
  }

  .app-title {
    font-size: 1.5rem;
  }

  .logo-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }
}
</style>
