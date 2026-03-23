<script setup>
import {ref} from 'vue'
import ComOne from "@components/ComOne/ComOne.vue";
import ComTwo from "@components/ComTwo/ComTwo.vue";
import CesiumViewer from "@components/CesiumViewer/CesiumViewer.vue";
import ArgoLayer from "@components/argo/ArgoLayer.vue";

const showArgoLayer = ref(false); // 控制 ArgoLayer 是否显示
const showControlPanel = ref(false); // 控制 control-panel 是否显示

// 切换显示状态的函数
function toggleArgoLayer() {
  showArgoLayer.value = !showArgoLayer.value;
}

function toggleControlPanel() {
  showControlPanel.value = !showControlPanel.value;
}
</script>

<template>
  <main>
    <!-- 顶部导航栏 -->
    <header class="top-navbar">
      <div class="nav-brand">
        <i class="pi pi-globe"></i>
        <span>Argo 数据系统</span>
      </div>
      
      <div class="nav-links">
        <router-link to="/" class="nav-link">
          <i class="pi pi-sign-out"></i>
          登出
        </router-link>
        <router-link :to="{name:'argoinfo'}" class="nav-link">
          <i class="pi pi-info-circle"></i>
          Argo信息
        </router-link>
        <button @click="toggleArgoLayer" :class="['nav-link', 'control-btn-in-navbar', { 'router-link-active': showArgoLayer, 'router-link-exact-active': showArgoLayer }]">
          <i :class="showArgoLayer ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
          {{ showArgoLayer ? '隐藏 ArgoLayer' : '显示 ArgoLayer' }}
        </button>
        <button @click="toggleControlPanel" class="nav-link control-panel-btn-in-navbar">
          <i :class="showControlPanel ? 'pi pi-sliders-h' : 'pi pi-sliders-v'"></i>
          控制面板
        </button>
      </div>
    </header>

    <div class="main-container">
      <!-- 左面板 -->
      <div class="left-panel">
        <!-- 左面板内容（可为空或其他内容） -->
      </div>

      <!-- 右面板 -->
      <div class="right-panel">
        <CesiumViewer :show-control-panel="showControlPanel" />

        <!-- 悬浮的 ArgoLayer，依据显示状态 -->
        <Transition name="fade-slide-panel">
          <div v-if="showArgoLayer" class="floating-argo-layer">
            <div class="argo-header">
              <h4>Argo 数据层</h4>
            </div>
            <div class="argo-content">
              <ArgoLayer></ArgoLayer>
            </div>
          </div>
        </Transition>

        <!-- Argo信息面板 -->
        <Transition name="panel-slide-right">
          <RouterView v-if="$route.name === 'argoinfo'" class="argo-info-panel argo-info-panel--right"/>
        </Transition>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* 主容器 */
main {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
}

/* 顶部导航栏 */
.top-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.nav-brand i {
  font-size: 1.5rem;
  color: #3498db;
}

.nav-links {
  display: flex;
  gap: 16px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: #2c3e50;
  text-decoration: none;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
  transform: translateY(-1px);
}

.nav-link i {
  font-size: 1rem;
}

/* 控制按钮 */
.control-btn-in-navbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: #2c3e50;
  background: none;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}
.control-btn-in-navbar:hover {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
  transform: translateY(-1px);
}
.control-btn-in-navbar i {
  font-size: 1rem;
}

/* 控制面板按钮（导航栏内） */
.control-panel-btn-in-navbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: #2c3e50;
  background: none;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}
.control-panel-btn-in-navbar:hover {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
  transform: translateY(-1px);
}
.control-panel-btn-in-navbar i {
  font-size: 1rem;
}

/* 主容器 */
.main-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  padding-top: 60px; /* 为顶部导航栏留出空间 */
}

/* 左面板 */
.left-panel {
  width: 0;
  min-width: 0;
  background: transparent;
}

/* 右面板 */
.right-panel {
  flex: 1;
  position: relative;
  height: 100%;
}

/* 确保Cesium容器填满空间 */
.right-panel ::v-deep #container {
  height: 100%;
  width: 100%;
}

/* 悬浮的 ArgoLayer 样式 */
.floating-argo-layer {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 320px;
  max-height: calc(100vh - 120px);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.argo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.argo-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.argo-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 右侧 Argo信息面板 */
.argo-info-panel--right {
  position: absolute;
  right: 0;
  top: 0;
  width: 40vw;
  min-width: 320px;
  max-width: 520px;
  height: 100%;
  background: linear-gradient(120deg, #e0eafc 0%, #cfdef3 100%);
  box-shadow: -4px 0 24px rgba(52, 152, 219, 0.12);
  border-radius: 16px 0 0 16px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeInRight 0.5s;
}

/* 新的内容布局样式 */
.argo-info-panel--right :deep(.info-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 24px 32px 16px 32px;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(255,255,255,0.15);
}
.argo-info-panel--right :deep(.info-content) {
  flex: 1;
  padding: 28px 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  overflow-y: auto;
}
.argo-info-panel--right :deep(.info-section) {
  background: rgba(255,255,255,0.85);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(102,126,234,0.08);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.argo-info-panel--right :deep(.info-title) {
  font-size: 1.1rem;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 6px;
}
.argo-info-panel--right :deep(.info-detail) {
  color: #2c3e50;
  font-size: 0.98rem;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .argo-info-panel--right {
    width: 100vw;
    min-width: 0;
    border-radius: 0;
  }
  .argo-info-panel--right :deep(.info-content) {
    grid-template-columns: 1fr;
    padding: 18px 10px;
  }
}

@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}

/* 右侧滑入动画 */
.panel-slide-right-enter-active,
.panel-slide-right-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.panel-slide-right-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.panel-slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .top-navbar {
    padding: 0 16px;
    height: 56px;
  }
  
  .nav-brand span {
    display: none;
  }
  
  .nav-links {
    gap: 8px;
  }
  
  .nav-link {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
  
  .floating-argo-layer {
    top: 10px;
    left: 10px;
    width: calc(100vw - 20px);
    max-width: 350px;
  }
  
  .argo-info-panel--right {
    width: 100vw;
    min-width: 0;
    border-radius: 0;
  }
}

/* 滚动条样式 */
.argo-content::-webkit-scrollbar {
  width: 6px;
}

.argo-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.argo-content::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.argo-content::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

/* 统一弹出控件过渡动画 */
.fade-slide-panel-enter-active,
.fade-slide-panel-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-panel-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.98);
}
.fade-slide-panel-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.98);
}

/* control-panel 动画（在 CesiumViewer.vue 里也可用同名类） */
.control-panel {
  transition: box-shadow 0.3s, transform 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.4s;
}
</style>