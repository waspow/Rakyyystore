<script setup>
import {onMounted, ref, watch, computed, onBeforeUnmount} from "vue";
import Button from "primevue/button";
import 'cesium/Build/Cesium/Widgets/widgets.css';
import CesiumBegin from "./js/CesiumBegin.js";
import {
  BOA,
  TianWMTSimg,
  header,
  meta,
  CoordinateDisplay,
  WMSsvectorlayer,
  CoffeeBelt,
  CustomWMSBasemap
} from "./js/CesiumImageryLayers.js";
import useStore, {usePlatformStore} from "@stores/mainstore.js";
import {storeToRefs} from "pinia";
import * as Cesium from 'cesium';

const store = useStore();
let viewer = ref(null);
let {viewer_store} = storeToRefs(store);
let {filterSelections} = storeToRefs(store);
let currentLayer = computed(() => store.layer);

// +++ 新增视频球体相关变量 +++
const videoElement = ref(null);
const showVideoSphere = ref(false);
let videoSphere = null;
const videoPosition = ref([120.2052342, 30.2489634, 10000]); // 球体初始位置 [经度, 纬度, 高度]
const videoSphereRadius = ref(3000); // 球体半径
const showVideoOverlay = ref(true);
watch(currentLayer, (newVal) => {
  if (newVal === 'null') {
    viewer.value.destroy();
    viewer.value = CesiumBegin.cbing('container', '/assets/cesium');
    TianWMTSimg.addTianWMTSimg(viewer.value);
    meta.addmeta(viewer.value, store.filterSelections);
    coordDisplayDestroyer = CoordinateDisplay.initialize(viewer.value, {});

    // +++ 重新创建视频球体 +++
    if (showVideoSphere.value) {
      createVideoSphere();
    }
  } else {
    BOA.addBOA(viewer.value, newVal);
    console.log(newVal);
  }
});
const createVideoSphere = async () => {
  if (!viewer.value || !videoElement.value) return;

  // 确保视频已加载
  await new Promise((resolve) => {
    if (videoElement.value.readyState >= 3) {
      resolve();
    } else {
      videoElement.value.onloadeddata = resolve;
    }
  });

  // 移除现有球体
  if (videoSphere) {
    viewer.value.entities.remove(videoSphere);
  }

  // 创建新球体
  videoSphere = viewer.value.entities.add({
    position: Cesium.Cartesian3.fromDegrees(
        videoPosition.value[0],
        videoPosition.value[1],
        videoPosition.value[2]
    ),
    ellipsoid: {
      radii: new Cesium.Cartesian3(
          videoSphereRadius.value,
          videoSphereRadius.value,
          videoSphereRadius.value
      ),
      material: videoElement.value,
    },
    show: showVideoSphere.value
  });
};

// +++ 修改视频球体切换函数 +++
const toggleVideoSphere = () => {
  showVideoSphere.value = !showVideoSphere.value;

  if (showVideoSphere.value) {
    // 显示视频控件
    videoElement.value.style.display = 'block';
    createVideoSphere();
    viewer.value.trackedEntity = videoSphere;
  } else {
    // 隐藏视频控件
    videoElement.value.style.display = 'none';
    if (videoSphere) {
      viewer.value.entities.remove(videoSphere);
      videoSphere = null;
    }
    viewer.value.trackedEntity = undefined;
  }
};
// +++ 修改球体位置更新函数 +++
const updateVideoPosition = () => {
  const lng = parseFloat(document.getElementById('lngInput').value);
  const lat = parseFloat(document.getElementById('latInput').value);
  const height = parseFloat(document.getElementById('heightInput').value);

  videoPosition.value = [lng, lat, height];

  if (videoSphere && showVideoSphere.value) {
    videoSphere.position = Cesium.Cartesian3.fromDegrees(lng, lat, height);
    // 更新后重新追踪球体
    viewer.value.trackedEntity = videoSphere;
  }
};

// +++ 修改球体半径更新函数 +++
const updateVideoRadius = () => {
  const radius = parseFloat(document.getElementById('radiusInput').value);
  videoSphereRadius.value = radius;

  if (videoSphere && showVideoSphere.value) {
    // 保持球体中心位置不变
    const position = videoSphere.position.getValue();

    // 先移除旧球体
    viewer.value.entities.remove(videoSphere);

    // 创建新球体
    videoSphere = viewer.value.entities.add({
      position: position,
      ellipsoid: {
        radii: new Cesium.Cartesian3(radius, radius, radius),
        material: videoElement.value,
      },
      show: true
    });

    // 重新追踪球体
    viewer.value.trackedEntity = videoSphere;
  }
};


let a = ref(true);
let b = ref(true);
const rectangleDegrees = ref([-120, -20.0, 70.0, 45.0]); // 使用ref包装

// 响应矩形范围变化
watch(rectangleDegrees, (newVal) => {
  if (coffeeBeltController) {
    coffeeBeltController.destroy();
  }
  // 重新创建 CoffeeBelt
  coffeeBeltController = CoffeeBelt.create(viewer.value, newVal, numRectangles, heightInterval, outlineStyle);
}, {deep: true});

function spilt() {
  if (a.value) {
    WMSsvectorlayer.addWMSsvectorlayer(
        viewer.value,
        "http://localhost:8080/geoserver/Argo/wms",
        "Argo:argometa",
        "",
        "1=1",
        true
    );
    a.value = false;
  } else {
    WMSsvectorlayer.removeExistingLayers(viewer.value);
    a.value = true;
  }
}

function parsePlatformInfo(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll('tr');
  const info = {};

  rows.forEach(row => {
    const tds = row.querySelectorAll('td');
    if (tds.length === 2) {
      const key = tds[0].textContent.trim().toLowerCase();
      const value = tds[1].textContent.trim();
      info[key] = value;
    }
  });

  return info;
}

const outlineStyle = {
  width: 2,
  color: Cesium.Color.RED
};
const numRectangles = 5;
const heightInterval = 500;
let coffeeBeltController = null;

function coffe() {
  if (b.value) {
    // 确保控制器存在
    if (!coffeeBeltController) {
      coffeeBeltController = CoffeeBelt.create(
          viewer.value,
          rectangleDegrees.value,
          numRectangles,
          heightInterval,
          outlineStyle
      );
    }
    coffeeBeltController.toggleLimit(true);
    coffeeBeltController.toggleBounds(true);
    b.value = false;
  } else {
    if (coffeeBeltController) {
      coffeeBeltController.toggleLimit(false);
      coffeeBeltController.toggleBounds(false);
    }
    b.value = true;
  }
}

const storea = usePlatformStore();
const debounceRefresh = ((func) => {
  let timer;
  return (viewer, params) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(viewer, params), 300);
  };
})(meta.addmeta);

watch(
    () => store.filterSelections,
    (newVal) => {
      debounceRefresh(viewer.value, newVal);
    },
    {deep: true}
);

let coordDisplayDestroyer = null;

onMounted(() => {
  viewer.value = CesiumBegin.cbing('container', '/assets/cesium');
  viewer_store.value = viewer;
  TianWMTSimg.addTianWMTSimg(viewer.value);
  meta.addmeta(viewer.value, store.filterSelections);
  coordDisplayDestroyer = CoordinateDisplay.initialize(viewer.value, {});

  coffeeBeltController = CoffeeBelt.create(
      viewer.value,
      rectangleDegrees.value,
      numRectangles,
      heightInterval,
      outlineStyle
  );

  coffeeBeltController.toggleLimit(false);
  coffeeBeltController.toggleBounds(false);

  const handler = viewer.value.screenSpaceEventHandler;
  handler.setInputAction((event) => {
    const entity = viewer.value.selectedEntity;
    if (entity) {
      if (entity.id !== 'None' || entity.id !== 'Loading...') {
        const htmlTable = viewer.value.selectedEntity.description._value;
        const platformInfo = parsePlatformInfo(htmlTable);
        storea.setPlatformInfo({
          platformNumber: platformInfo.platformnumber
        });
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
});


onBeforeUnmount(() => {
  if (coffeeBeltController) {
    coffeeBeltController.destroy();
  }
  if (viewer.value && !viewer.value.isDestroyed()) {
    viewer.value.destroy();
  }
});

// 更新矩形范围的函数
function updateRectangleDegrees() {
  const west = parseFloat(document.getElementById('westInput').value);
  const south = parseFloat(document.getElementById('southInput').value);
  const east = parseFloat(document.getElementById('eastInput').value);
  const north = parseFloat(document.getElementById('northInput').value);

  rectangleDegrees.value = [west, south, east, north];

  // 如果咖啡带当前是显示状态，更新后保持显示
  if (!b.value && coffeeBeltController) {
    coffeeBeltController.toggleLimit(true);
    coffeeBeltController.toggleBounds(true);
  }
}

const viewMode = ref('2.5D'); // 初始2.5D

function toggleViewMode() {
  if (viewMode.value === '2.5D') {
    viewMode.value = '3D';
    // 切换3D模式
    viewer.value.scene.mode = Cesium.SceneMode.COLUMBUS_VIEW;
  } else if (viewMode.value === '3D') {
    viewMode.value = '2D';
    // 切换2D模式
    viewer.value.scene.mode = Cesium.SceneMode.SCENE2D;
  } else {
    viewMode.value = '2.5D';
    // 切换2.5D（例如，科幻视角或默认模式）
    viewer.value.scene.mode = Cesium.SceneMode.COLUMBUS_VIEW; // 你可以自定义你的2.5D为哪种设置
  }
}

watch(
    () => store.filterSelections,
    (newVal) => {
      console.log('筛选条件更新：', JSON.parse(JSON.stringify(newVal)));
    },
    {deep: true}
);
// +++ 添加视频控制函数 +++
const toggleVideoPlay = () => {
  if (videoElement.value.paused) {
    videoElement.value.play();
  } else {
    videoElement.value.pause();
  }
};

const restartVideo = () => {
  videoElement.value.currentTime = 0;
  videoElement.value.play();
};

function toggleVideoOverlay() {

  showVideoOverlay.value = !showVideoOverlay.value;
  if (showVideoOverlay.value) {
    videoElement.value.style.display = 'block';
    createVideoSphere();
    viewer.value.trackedEntity = videoSphere;
  } else {
    // 隐藏视频控件
    videoElement.value.style.display = 'none';
    if (videoSphere) {
      viewer.value.entities.remove(videoSphere);
      videoSphere = null;
    }
    viewer.value.trackedEntity = undefined;
  }
}

// 在顶部添加props定义
const props = defineProps({
  showControlPanel: {
    type: Boolean,
    default: false
  }
});

// 在script setup部分添加basemapType和switchBasemap
const basemapType = ref('tianditu'); // 默认天地图

function switchBasemap(type) {
  basemapType.value = type;
  if (type === 'tianditu') {
    viewer.value.imageryLayers.removeAll();
    TianWMTSimg.addTianWMTSimg(viewer.value);
    meta.addmeta(viewer.value, store.filterSelections);
  }
}

// 在script setup部分添加year、month、depth的响应式变量和loadArgoLayer方法
const year = ref(2004);
const month = ref(1);
const depth = ref(1975);

const loadArgoLayer = () => {
  const layerName = `argoproject:argo_temp_${year.value}_${month.value}_${depth.value}`;
  console.log('Loading Argo layer:', layerName);
  store.setLayerName(layerName);
  CustomWMSBasemap.addArgoBasemap(viewer.value);
};

const showLayerControl = ref(false);

const toggleLayerControl = () => {
  showLayerControl.value = !showLayerControl.value;
};

</script>

<template>
  <section id="container">
    <header class="fixed-top text-info text-right fs-4 w-63 d-flex align-items-center justify-content-between"
            style="position:relative;">
      <div class="d-flex align-items-center">
        <slot></slot>
      </div>
      <div class="header-center-btn-wrapper">
        <button class="nav-link control-panel-btn-in-navbar" @click="toggleLayerControl">
          <i class="pi pi-layers"></i> 图层切换
        </button>
      </div>
      <div class="d-flex align-items-center navbar-btn-group">
        <!-- 其他右侧按钮 -->
      </div>
    </header>
    <video
        ref="videoElement"
        src="C:\Users\22548\Desktop\大三下\LJS期末考试\vue-untitled - 副本 - 副本 (2)\src\video\屏幕录制 2025-06-04 092224.mp4"
        controls
        muted
        loop
        crossorigin="anonymous"
        class="video-overlay"
        style="position: absolute; bottom: 20px; left: 20px; width: 300px; z-index: 1000; display: none;"
    ></video>
    <!-- 合并后的控制面板卡片，带动画 -->
    <Transition name="panel-fade-slide">
      <div v-if="props.showControlPanel" class="control-panel-card">
        <div class="control-section">
          <h6>地图控制</h6>
          <div class="input-group mb-2">
            <span class="input-group-text">西经</span>
            <input id="westInput" type="number" class="form-control" :value="rectangleDegrees[0]">
          </div>
          <div class="input-group mb-2">
            <span class="input-group-text">南纬</span>
            <input id="southInput" type="number" class="form-control" :value="rectangleDegrees[1]">
          </div>
          <div class="input-group mb-2">
            <span class="input-group-text">东经</span>
            <input id="eastInput" type="number" class="form-control" :value="rectangleDegrees[2]">
          </div>
          <div class="input-group mb-2">
            <span class="input-group-text">北纬</span>
            <input id="northInput" type="number" class="form-control" :value="rectangleDegrees[3]">
          </div>
          <div class="d-grid gap-2">
            <Button @click="updateRectangleDegrees" class="btn-sm" style="background: #acc0b8;">更新范围</Button>
            <Button @click="spilt" class="btn-sm" style="background: #acc0b8;">分屏显示</Button>
            <Button @click="toggleViewMode" class="btn-sm" style="background: #acc0b8;">
              视图: {{ viewMode }}
            </Button>
            <Button @click="coffe" class="btn-sm" style="background: #acc0b8;">
              {{ b ? '显示' : '隐藏' }}条带
            </Button>
          </div>
        </div>
        <div class="control-section">
          <h6>视频球体</h6>
          <div class="input-group mb-2">
            <span class="input-group-text">经度</span>
            <input id="lngInput" type="number" class="form-control" :value="videoPosition[0]">
          </div>
          <div class="input-group mb-2">
            <span class="input-group-text">纬度</span>
            <input id="latInput" type="number" class="form-control" :value="videoPosition[1]">
          </div>
          <div class="input-group mb-2">
            <span class="input-group-text">高度</span>
            <input id="heightInput" type="number" class="form-control" :value="videoPosition[2]">
          </div>
          <div class="input-group mb-2">
            <span class="input-group-text">半径</span>
            <input id="radiusInput" type="number" class="form-control" :value="videoSphereRadius">
          </div>
          <div class="d-grid gap-2">
            <Button @click="updateVideoPosition" class="btn-sm" style="background: #ad7d88;">更新位置</Button>
            <Button @click="updateVideoRadius" class="btn-sm" style="background: #ad7d88;">更新半径</Button>
            <Button @click="toggleVideoSphere" class="btn-sm" style="background: #ad7d88;">
              {{ showVideoSphere ? '隐藏' : '显示' }}视频球体
            </Button>
            <Button @click="toggleVideoOverlay" class="btn-sm" style="background: #ad7d88;">
              {{ showVideoOverlay ? '隐藏' : '显示' }}播放控件
            </Button>
            <Button @click="toggleVideoPlay" class="btn-sm" style="background: #ad7d88;">
              {{ videoElement?.paused ? '播放' : '暂停' }}
            </Button>
            <Button @click="restartVideo" class="btn-sm" style="background: #ad7d88;">重播视频</Button>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.control-panel-card {
  position: fixed;
  top: 80px;
  right: 40px;
  width: 320px;
  max-height: calc(100vh - 100px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(52, 152, 219, 0.18);
  z-index: 2000;
  padding: 20px 16px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
}

/* 控制面板动画 */
.panel-fade-slide-enter-active,
.panel-fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-fade-slide-enter-from,
.panel-fade-slide-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

.control-section {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(52, 152, 219, 0.10);
  padding: 24px 20px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid #e3e8ee;
  transition: box-shadow 0.3s;
}

.control-section:hover {
  box-shadow: 0 8px 32px rgba(52, 152, 219, 0.18);
}

.control-section h6 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #3498db;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.input-group-text {
  background: #eaf6fb;
  color: #3498db;
  border: none;
  border-radius: 8px 0 0 8px;
  padding: 6px 12px;
  font-size: 0.95rem;
  font-weight: 500;
}

.form-control {
  border: 1px solid #d0e2f2;
  border-radius: 0 8px 8px 0;
  padding: 6px 10px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  outline: none;
}

.form-control:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 2px #eaf6fb;
}

.d-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.btn-sm, :deep(.p-button) {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  color: #fff !important;
  border: none !important;
  border-radius: 8px !important;
  font-size: 0.95rem !important;
  font-weight: 500;
  padding: 6px 16px !important;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.08);
  transition: background 0.2s, transform 0.2s;
}

.btn-sm:hover, :deep(.p-button):hover {
  background: linear-gradient(135deg, #0984e3 0%, #74b9ff 100%);
  color: #fff !important;
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 4px 16px rgba(52, 152, 219, 0.15);
}

.video-overlay {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 300px;
  z-index: 1000;
}

.w-63 {
  width: 63% !important;
}

.w-5 {
  width: 5% !important;
}

.fixed-top {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 1030;
}

.fixed-righta {
  position: fixed;
  top: 0;
  right: 0;
  left: 90%;
  z-index: 1030;
}

.fixed-rightb {
  position: fixed;
  top: 0;
  right: 0;
  left: 95%;
  z-index: 1030;
}

.text-right {
  text-align: right !important;
}

.navbar-btn-group {
  gap: 8px;
}

.nav-link.control-panel-btn-in-navbar {
  color: transparent !important;
}

.control-panel-btn-in-navbar {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  transition: color 0.3s;
  display: flex;
  align-items: center;
}

.control-panel-btn-in-navbar i {
  margin-right: 4px;
  font-size: 1.1rem;
}

.control-panel-btn-in-navbar:hover {
  color: #138496;
}

.header-center-btn-wrapper {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translate(-50%, 0);
  z-index: 10;
}
</style>
