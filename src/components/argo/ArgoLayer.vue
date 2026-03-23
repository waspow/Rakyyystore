<script setup>
import {computed, ref, watch, watchEffect} from "vue";
import {storeToRefs} from "pinia"
import Select from "primevue/select";
import FloatLabel from "primevue/floatlabel";
import Button from "primevue/button";
import useStore from "@stores/mainstore.js";
import Checkbox from "primevue/checkbox";
import {meta, BOA, TianWMTSimg} from "@components/CesiumViewer/js/CesiumImageryLayers.js";


const store = useStore()
const {filterSelections, viewer_store} = storeToRefs(store);
const {Data} = storeToRefs(store);
const years = ref([2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
  2020, 2021, 2022, 2023, 2024, 2025]);
const year = ref(null);
const month = ref(null);
const months = ref(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']);
const features = ref([
  {name: "温度", code: 'BOAtemp'},
  {name: "盐度", code: 'BOAsalt'}
]);
const Fmodels = ref(['APEX', 'ARVOR_D', 'HM4000', 'NINJA_D', 'SOLO_D', 'SOLO_D_MRV', 'XUANWU']);
const DACs = ref(['AOML', 'BODC', 'CORIOLIS', 'CSIO', 'CSIRO', 'JMA', 'KMA', 'KORDI', 'MEDS', 'NMDIS']);
const Dyears = ref([
  2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009,
  2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
  2020, 2021, 2022, 2023, 2024, 2025
]);
// 将年份数组拆分为左右两列
const splitIndex = computed(() => Math.ceil(Dyears.value.length / 2));
const leftYears = computed(() => Dyears.value.slice(0, splitIndex.value));
const rightYears = computed(() => Dyears.value.slice(splitIndex.value));

// 选中年份数组

const feature = ref(null);
const layerName = computed(() =>
    `${feature.value || ''}${year.value || ''}${month.value || ''}`
);

const isFormValid = computed(() =>
    year.value && month.value && feature.value
);


// 确认操作
const selectedYears = ref([...filterSelections.value.years])
const selectedFmodel = ref([...filterSelections.value.fmodels])
const selectedDACs = ref([...filterSelections.value.dacs])
const statusCounts = ref({active: 0, inactive: 0});
const depths = ref([1975, 1000, 500, 200]);
const depth = ref(1975);
const updateLayerName = () => {
  const monthStr = month.value ? month.value.toString().padStart(2, '0') : '';
  const name = `Argo:argo_temp_${year.value}_${monthStr}_${depth.value}`;
  store.setLayerName(name);
  if (viewer_store.value && name) {
    BOA.addBOA(viewer_store.value, name);
  }
};
const clearLayerName = () => {
  store.setLayerName('');
  if (viewer_store.value) {
    viewer_store.value.imageryLayers.removeAll();
    TianWMTSimg.addTianWMTSimg(viewer_store.value);
  }
};

// 绑定到store的计算属性
const selectedActive = computed({
  get: () => store.filterSelections.Active,
  set: (val) => store.updateFilterSelections({Active: val})
});

const selectedInactive = computed({
  get: () => store.filterSelections.Inactive,
  set: (val) => store.updateFilterSelections({Inactive: val})
});

// 监听筛选条件变化
watch(
    () => ({
      years: store.filterSelections.years,
      fmodels: store.filterSelections.fmodels,
      dacs: store.filterSelections.dacs,
      Active: store.filterSelections.Active,
      Inactive: store.filterSelections.Inactive
    }),
    async (params) => {
      try {

        // 获取统计数量
        const counts = await meta.getStatusCounts(params);
        console.log(counts)
        statusCounts.value = counts;
      } catch (error) {
        console.error("操作失败:", error);
      }
    },
    {deep: true, immediate: true}
);
watch(selectedYears, (newVal) => {
  store.updateFilterSelections({years: newVal})
})

watch(selectedFmodel, (newVal) => {
  store.updateFilterSelections({fmodels: newVal})
})

watch(selectedDACs, (newVal) => {
  store.updateFilterSelections({dacs: newVal})
})
watch(selectedActive, (newVal) => {
  store.updateFilterSelections({Active: newVal})
  console.log(newVal)
})
watch(selectedInactive, (newVal) => {
  store.updateFilterSelections({Inactive: newVal})
  console.log(newVal)
})

// DAC中英文对照表
const dacInfo = {
  AOML: {zh: '美国迈阿密海洋与大气管理局', icon: 'pi pi-database'},
  BODC: {zh: '英国海洋数据中心', icon: 'pi pi-database'},
  CORIOLIS: {zh: '法国Coriolis中心', icon: 'pi pi-database'},
  CSIO: {zh: '中国科学院南海海洋研究所', icon: 'pi pi-database'},
  CSIRO: {zh: '澳大利亚联邦科学与工业研究组织', icon: 'pi pi-database'},
  JMA: {zh: '日本气象厅', icon: 'pi pi-database'},
  KMA: {zh: '韩国气象厅', icon: 'pi pi-database'},
  KORDI: {zh: '韩国海洋研究与开发院', icon: 'pi pi-database'},
  MEDS: {zh: '加拿大海洋环境数据服务', icon: 'pi pi-database'},
  NMDIS: {zh: '中国国家海洋信息中心', icon: 'pi pi-database'}
};

</script>

<template>
  <div class="argo-container">
    <!-- 标题区域 -->
    <div class="header-section">
      <h2 class="main-title">Argo测量数据平台</h2>
    </div>

    <!-- BOA 配置区域 -->
    <div class="config-section">
      <h5 class="section-title">
        <i class="pi pi-chart-line"></i>
        BOA 数据配置
      </h5>

      <div class="form-grid">
        <div class="form-item">
          <FloatLabel variant="on">
            <Select
                v-model="year"
                :options="years"
                checkmark
                class="custom-select"
            />
            <label>年份</label>
          </FloatLabel>
        </div>

        <div class="form-item">
          <FloatLabel variant="on">
            <Select
                v-model="month"
                :options="months"
                checkmark
                class="custom-select"
            />
            <label>月份</label>
          </FloatLabel>
        </div>

        <div class="form-item">
          <FloatLabel variant="on">
            <Select
                v-model="feature"
                :options="features"
                option-label="name"
                option-value="code"
                checkmark
                class="custom-select"
            />
            <label>数据类型</label>
          </FloatLabel>
        </div>

        <div class="form-item">
          <FloatLabel variant="on">
            <Select
                v-model="depth"
                :options="depths"
                checkmark
                class="custom-select"
            />
            <label>深度</label>
          </FloatLabel>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="button-group">
        <Button
            label="生成图层"
            icon="pi pi-plus"
            :disabled="!isFormValid"
            @click="updateLayerName"
            class="primary-btn"
        />
        <Button
            label="移除图层"
            icon="pi pi-trash"
            :disabled="!isFormValid"
            @click="clearLayerName"
            class="secondary-btn"
        />
      </div>
    </div>

    <!-- 状态筛选区域 -->
    <div class="filter-section">
      <h5 class="section-title">
        <i class="pi pi-check-circle"></i>
        浮标状态筛选
      </h5>

      <div class="status-grid">
        <div class="status-item">
          <Checkbox
              v-model="selectedActive"
              id="Active"
              :binary="true"
              class="custom-checkbox"
          />
          <label for="Active" class="status-label">
            <span class="status-name">活跃中 (Active)</span>
            <span class="status-count">{{ statusCounts.active }}</span>
          </label>
        </div>

        <div class="status-item">
          <Checkbox
              v-model="selectedInactive"
              id="Inactive"
              :binary="true"
              class="custom-checkbox"
          />
          <label for="Inactive" class="status-label">
            <span class="status-name">离线中 (Inactive)</span>
            <span class="status-count">{{ statusCounts.inactive }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- DAC 筛选区域 -->
    <div class="filter-section">
      <h5 class="section-title">
        <i class="pi pi-database"></i>
        数据中心 (DAC)
      </h5>

      <div class="dac-grid">
        <div v-for="DAC in DACs"
             :key="DAC"
             class="dac-item"
        >
          <Checkbox
              v-model="selectedDACs"
              :id="`${DAC}`"
              :value="DAC"
              class="custom-checkbox"
          />
          <i :class="dacInfo[DAC]?.icon || 'pi pi-database'"
             style="color:#667eea;font-size:1.1em;margin-right:4px;"></i>
          <label :for="`${DAC}`" class="dac-label">
            {{ DAC }}
            <span v-if="dacInfo[DAC]">（{{ dacInfo[DAC].zh }}）</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.argo-container {
  height: 100%;
  overflow-y: auto;
  padding: 0;
  background: transparent;
  color: #2c3e50;
}

/* 滚动条样式 */
.argo-container::-webkit-scrollbar {
  width: 6px;
}

.argo-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.argo-container::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.argo-container::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

/* 标题区域 */
.header-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.2);
}

.main-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  text-align: center;
}

/* 配置区域 */
.config-section {
  margin-bottom: 32px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title i {
  color: #667eea;
  font-size: 1.2rem;
}

/* 表单网格 */
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.form-item {
  position: relative;
}

/* 自定义选择框样式 */
:deep(.custom-select .p-select) {
  width: 100%;
}

:deep(.custom-select .p-select-trigger) {
  border-radius: 8px;
  border: 2px solid #e1e8ed;
  transition: all 0.3s ease;
}

:deep(.custom-select .p-select-trigger:hover) {
  border-color: #667eea;
}

:deep(.custom-select .p-select-trigger.p-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

:deep(.custom-select .p-float-label label) {
  color: #6c757d;
  font-weight: 500;
}

/* 按钮组 */
.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.secondary-btn {
  background: rgba(108, 117, 125, 0.1);
  border: 1px solid rgba(108, 117, 125, 0.3);
  color: #6c757d;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.secondary-btn:hover:not(:disabled) {
  background: rgba(108, 117, 125, 0.2);
  transform: translateY(-2px);
}

/* 筛选区域 */
.filter-section {
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

/* 状态网格 */
.status-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

.status-item:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateX(4px);
}

.status-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  cursor: pointer;
  font-weight: 500;
}

.status-name {
  color: #2c3e50;
}

.status-count {
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

/* DAC 网格 */
.dac-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.dac-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

.dac-item:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.dac-label {
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #2c3e50;
  flex: 1;
}

/* 自定义复选框样式 */
:deep(.custom-checkbox .p-checkbox) {
  width: 18px;
  height: 18px;
}

:deep(.custom-checkbox .p-checkbox-box) {
  border: 2px solid #667eea;
  border-radius: 4px;
  background: white;
  transition: all 0.3s ease;
}

:deep(.custom-checkbox .p-checkbox-box:hover) {
  border-color: #764ba2;
  background: rgba(102, 126, 234, 0.1);
}

:deep(.custom-checkbox .p-checkbox-box.p-highlight) {
  background: #667eea;
  border-color: #667eea;
}

:deep(.custom-checkbox .p-checkbox-icon) {
  color: white;
  font-size: 0.8rem;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .config-section,
  .filter-section {
    padding: 16px;
  }

  .form-grid {
    gap: 12px;
  }

  .button-group {
    flex-direction: column;
  }

  .dac-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }

  .status-item {
    padding: 10px 12px;
  }

  .dac-item {
    padding: 6px 10px;
  }
}
</style>