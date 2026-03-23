/* vue-untitled / 2025-05-13 / gis@jou.edu.cn */
<script setup>
import ComOne from "@components/ComOne/ComOne.vue";
import ComTwo from "@components/ComTwo/ComTwo.vue";
import CesiumViewer from "@components/CesiumViewer/CesiumViewer.vue";
import ArgoLayer from "@components/argo/ArgoLayer.vue";

</script>

<template>
  <main>

    <section>
      <router-view></router-view>
    </section>
  </main>
</template>

<style scoped>
.nav-links {
  position: fixed;
  top: 5px;
  right: 50px;
  z-index: 1000;
  display: flex;
  gap: 15px;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-links a {
  color: #275f94;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-links a:hover {
  color: #1a3d5f;
}

.main-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.left-panel {
  z-index: 1000;
  flex: 1;
  min-width: 17%;
  max-width: 17%;
  background: #275f94;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  /* 新增白色细边 */
  border-right: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 2px rgba(255, 255, 255, 0.2);
}

.right-panel {
  position: relative;
}


/* 新增动画关键帧 */
@keyframes panelSlideIn {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }

  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes panelSlideOut {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(-100%);
    opacity: 0;
  }
}

/* 修改面板容器样式 */
.argo-info-panel {
  position: absolute;
  left: 0; /* 对齐左面板右侧 */
  top: 0;
  width: 40%;
  height: 100%;
  background: white;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
  z-index: 999;
  overflow: hidden;
}

/* Vue过渡类 */
.panel-slide-enter-active {
  animation: panelSlideIn var(--animation-duration) cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-slide-leave-active {
  animation: panelSlideOut var(--animation-duration) cubic-bezier(0.4, 0, 0.2, 1);
}


.right-panel {
  flex: 5;
  min-width: 83%;
  height: 100%;
  position: relative;
}

/* 确保Cesium容器填满空间 */
.right-panel ::v-deep #container {
  height: 100%;
  width: 100%;
}
</style>
