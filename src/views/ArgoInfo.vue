<template>
  <div class="argo-info-panel">
    <!-- 关闭按钮 -->
    <button class="close-btn" @click="closePanel">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor"
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>

    <!-- 加载遮罩 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>加载浮标数据中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage && activeTab === 'chart'" class="error-message">
      <p>{{ errorMessage }}</p>
      <button @click="retryLoad">重试</button>
    </div>

    <!-- TAB导航 -->
    <div class="tab-nav">
      <!--      <div>Platform Number: {{ platformNumber || '未选择' }}</div>-->
      <button
          v-for="tab in ['list', 'metadata', 'chart']"
          :key="tab"
          :class="{ active: activeTab === tab }"
          @click="switchTab(tab)"
      >
        {{ tab === 'list' ? '浮标列表' : tab === 'metadata' ? '详细信息' : '数据图表' }}
      </button>
    </div>

    <!-- 浮标列表 -->
    <div v-show="activeTab === 'list'" class="scroll-container">
      <div class="buoy-list">
        <div
            v-for="buoy in buoyList"
            :key="buoy.platformNumber + '-' + buoy.cycleNumber"
            :class="{ 'buoy-item': true, 'selected': selectedCycle === buoy.cycleNumber }"
            @click="selectBuoy(buoy)"
        >
          <div class="buoy-header">
            <span class="platform-number">平台编号：{{ buoy.platformNumber }}</span>
            <span class="cycle-number">Cycle {{ buoy.cycleNumber }}</span>
            <span class="data-status" :class="{ 'has-data': buoy.hasData, 'no-data': !buoy.hasData }">
              {{ buoy.hasData ? '📊' : '❌' }}
            </span>
          </div>
          <div class="buoy-info">
            <span>位置: {{ buoy.latitude }}°N, {{ buoy.longitude }}°E</span>
            <span>日期: {{ buoy.sampleDate || '未知' }}</span>
            <span class="data-hint" v-if="!buoy.hasData">暂无核心数据</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 元数据标签 -->
    <div v-show="activeTab === 'metadata'" class="scroll-container">
      <template v-if="selectedBuoy">
        <div class="metadata-grid">
          <div class="metadata-item"><label>平台编号</label><span>{{ metadata.platformnumber }}</span></div>
          <div class="metadata-item"><label>投放日期</label><span>{{ metadata.launchdate || '未知' }}</span></div>
          <div class="metadata-item"><label>项目名称</label><span>{{ metadata.projectname }}</span></div>
          <div class="metadata-item"><label>研究人员</label><span>{{ metadata.piname }}</span></div>
          <div class="metadata-item"><label>数据中心</label><span>{{ metadata.datacentre }}</span></div>
          <div class="metadata-item"><label>当前位置</label><span>{{
              metadata.launchlatitude
            }}°N, {{ metadata.launchlongitude }}°E</span></div>
        </div>
      </template>
      <div v-else class="no-selection">
        <i class="icon-info"></i> 请在列表中选择一个浮标
      </div>
    </div>

    <!-- 图表显示 -->
    <div v-show="activeTab === 'chart'" class="scroll-container">
      <div v-if="selectedBuoy && coreData.length > 0" class="chart-container">
        <div ref="tempChartRef" class="chart"></div>
        <div ref="salinityChartRef" class="chart"></div>
      </div>
      <div v-if="!selectedBuoy" class="chart-notice">
        当前显示为示例数据，选择浮标后显示具体观测数据
      </div>
      <div v-else-if="isLoading" class="chart-notice">
        <div class="loading-spinner"></div>
        正在加载图表数据...
      </div>
      <div v-else-if="coreData.length === 0 && selectedBuoy" class="chart-notice no-data">
        <div class="no-data-icon">📊</div>
        <h3>暂无观测数据</h3>
        <p>浮标 {{ selectedBuoy.platformNumber }} Cycle {{ selectedBuoy.cycleNumber }} 当前没有可用的核心观测数据</p>
        <p class="suggestion">建议尝试选择其他周期的浮标数据</p>
        <div class="no-data-actions">
          <button @click="tryOtherCycles" class="try-other-btn">
            查看其他周期数据
          </button>
        </div>
      </div>
      <div v-else-if="coreData.length > 0" class="chart-info">
        显示浮标 {{ selectedBuoy.platformNumber }} Cycle {{ selectedBuoy.cycleNumber }} 的观测数据
        <br>数据点数量: {{ coreData.length }}
      </div>
    </div>
  </div>
</template>


<script setup>
import {ref, onMounted, onUnmounted, nextTick, watch, computed} from 'vue'
import {useRouter} from 'vue-router'
import {usePlatformStore} from '@stores/mainstore.js' // 你的store路径
import * as echarts from 'echarts'


// 获取store中的platformNumber
const store = usePlatformStore()
const platformNumber = computed(() => store.platformNumber)
const router = useRouter()
// 响应式状态
const selectedBuoy = ref(null)
const activeTab = ref('metadata')
const selectedCycle = ref(null) // 存储选中的周期号
const buoyList = ref([])
const rawData = ref([]);
const headerFields = [
  'platformNumber',
  'cycleNumber',
  'dataMode',
  'sampleDirection',
  'sampleDate',
  'latitude',
  'longitude',
  'coordinateHex'
];
const loadBuoyList = async (platformNumberVal) => {
  try {
    isLoading.value = true;
    const response = await fetch(`http://127.0.0.1:8000/argoheaderinfo/${platformNumberVal}`)
    // ECHARTRS实现
    if (!response.ok) throw new Error(`请求错误：${response.status}`);
    const data = await response.json();
    rawData.value = data;

    buoyList.value = data.map(item => {
      const obj = {};
      headerFields.forEach((field, index) => {
        obj[field] = item[index];
      });
      // 暂时设置为true，后续可以通过API检查
      obj.hasData = true; // 这里可以后续优化为实际检查
      return obj;
    });

    // 设置默认选择：找到最小周期号的浮标
    if (buoyList.value.length > 0) {
      const minCycleBuoy = buoyList.value.reduce((min, current) =>
          parseInt(current.cycleNumber) < parseInt(min.cycleNumber) ? current : min
      );
      selectBuoy(minCycleBuoy);
    }
  } catch (err) {
    console.error('加载浮标列表失败：', err);
    // 只在列表页面显示错误信息
    if (activeTab.value === 'list') {
      errorMessage.value = `加载浮标列表失败：${err.message}`;
    }
  } finally {
    isLoading.value = false;
  }
}

// 选择浮标处理函数
const selectBuoy = (buoy) => {
  selectedBuoy.value = buoy; // 设置选中的浮标
  selectedCycle.value = buoy.cycleNumber;
  // 立即加载该周期的核心数据
  fetchCoreData(store.platformNumber, buoy.cycleNumber);
}


const coreData = ref([])
const metadata = ref({
  platformnumber: '',
  transmissionsystem: '',
  positioningsystem: '',
  platformmodel: '',
  wmoinstrumenttype: '',
  projectname: '',
  datacentre: '',
  piname: '',
  launchdate: '',
  launchlatitude: '',
  launchlongitude: '',
  sensorsonthefloat: '',
  profilepressure: ''
});

const isLoading = ref(false)
const errorMessage = ref(null)

const tempChartRef = ref(null)
const salinityChartRef = ref(null)
let tempChart = null
let salinityChart = null
let abortController = null
const chartOptions = (title, field) => {
  // 验证数据
  const validData = coreData.value.filter(d =>
      d && typeof d[field] === 'number' && !isNaN(d[field]) &&
      typeof d.pressure === 'number' && !isNaN(d.pressure)
  );

  if (validData.length === 0) {
    console.warn(`没有有效的${field}数据`);
    return {
      title: {text: title, left: 'center', textStyle: {color: '#275f94'}},
      grid: {left: '0%', right: '20%', containLabel: true},
      xAxis: {type: 'value'},
      yAxis: {type: 'value'},
      series: [{type: 'line', data: []}]
    };
  }

  return {
    title: {text: title, left: 'center', textStyle: {color: '#275f94'}},
    grid: {left: '0%', right: '20%', containLabel: true},
    yAxis: {
      type: 'value',
      inverse: true,
      name: '深度（压力）',
      nameLocation: 'end',
      axisLabel: {
        formatter: value => `${value} dbar`
      },
      splitNumber: 8
    },
    xAxis: {
      type: 'value',
      name: field === 'temperature' ? '温度 (°C)' : '盐度 (PSU)',
      splitNumber: 10,
      minInterval: 0.1,
      maxInterval: 5,
      axisLabel: {
        interval: 0,
        rotate: 0,
        margin: 10
      }
    },
    dataset: {source: validData.map(d => [d[field], d.pressure])},
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: {width: 2, color: field === 'temperature' ? '#e74c3c' : '#3498db'}
    }],
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0].data;
        return `${field === 'temperature' ? '温度' : '盐度'}: ${data[0].toFixed(2)}<br>深度（压力）: ${data[1]} dbar`;
      }
    }
  };
}


// 加载元信息详情（基于platformNumber）
const loadMetaInfo = async (platformNumberVal) => {
  try {
    const response = await fetch(`http://127.0.0.1:8000/argometainfo/${platformNumberVal}`)
    if (!response.ok) throw new Error(`请求错误：${response.status}`)
    console.log(response)
    const data = await response.json()
    if (data.length > 0) {
      const rec = data[0]
      // 假设返回的数据结构符合你的数据库字段
      console.log('返回数据:', data);
      console.log('更新前的metadata:', metadata.value);
      metadata.value = {
        platformnumber: rec[0],
        transmissionsystem: rec[1],
        positioningsystem: rec[2],
        platformmodel: rec[3],
        wmoinstrumenttype: rec[4],
        projectname: rec[5],
        datacentre: rec[6],
        piname: rec[7],
        launchdate: rec[8],
        launchlatitude: rec[9],
        launchlongitude: rec[10],
        sensorsonthefloat: rec[11],
        profilepressure: rec[12]
      }

      console.log('更新后的metadata:', metadata.value);
    } else {
      // 如果无数据，根据需要处理
      // 这里可以清空或提示
    }
  } catch (err) {
    // 只在元数据页面显示错误信息
    if (activeTab.value === 'metadata') {
      errorMessage.value = `加载元信息失败：${err.message}`;
    }
    console.error('加载元信息错误:', err)
  }
}

// 获取核心数据集（根据platformNumber）
const fetchCoreData = async (platformNumberVal, cycleNumber) => {
  if (!platformNumberVal || !cycleNumber) {
    console.log('缺少必要参数:', {platformNumberVal, cycleNumber});
    return;
  }

  try {
    isLoading.value = true;
    console.log(`开始获取数据: ${platformNumberVal}, Cycle: ${cycleNumber}`);

    const response = await fetch(`http://127.0.0.1:8000/argocore/${platformNumberVal}/${cycleNumber}`)
    if (!response.ok) throw new Error(`请求失败：${response.status}`);

    const data = await response.json();
    console.log('原始数据:', data);

    if (data.length === 0) {
      console.warn(`浮标 ${platformNumberVal} Cycle ${cycleNumber} 没有核心观测数据`);
      coreData.value = [];
      // 只在图表页面显示错误信息
      if (activeTab.value === 'chart') {
        errorMessage.value = `浮标 ${platformNumberVal} Cycle ${cycleNumber} 暂无核心观测数据`;
      }
      return;
    }

    // 处理返回的二维数组
    coreData.value = data.map(row => ({
      pressure: parseFloat(row[2]),     // 第一列：压力
      temperature: parseFloat(row[3]),  // 第二列：温度
      salinity: parseFloat(row[4])      // 第三列：盐度
    })).filter(item => !isNaN(item.pressure) && !isNaN(item.temperature) && !isNaN(item.salinity));

    console.log('核心数据加载成功:', coreData.value);
    console.log('数据点数量:', coreData.value.length);

    if (coreData.value.length === 0) {
      console.warn('过滤后没有有效数据');
      // 只在图表页面显示错误信息
      if (activeTab.value === 'chart') {
        errorMessage.value = `浮标 ${platformNumberVal} Cycle ${cycleNumber} 的数据格式异常`;
      }
      return;
    }

    // 清除之前的错误信息
    errorMessage.value = null;

    // 如果当前在图表标签页，更新图表
    if (activeTab.value === 'chart') {
      nextTick(() => {
        initCharts();
      });
    }
  } catch (err) {
    // 只在图表页面显示错误信息
    if (activeTab.value === 'chart') {
      errorMessage.value = `获取核心数据失败: ${err.message}`;
    }
    console.error('获取核心数据错误:', err);
  } finally {
    isLoading.value = false;
  }
}


// 初始化图表
const initCharts = () => {
  console.log('初始化图表，数据长度:', coreData.value.length);

  if (!tempChartRef.value || !salinityChartRef.value) {
    console.log('图表容器未找到');
    return;
  }

  if (coreData.value.length === 0) {
    console.log('没有数据可绘制');
    return;
  }

  // 清理旧图表
  if (tempChart) {
    tempChart.dispose();
  }
  if (salinityChart) {
    salinityChart.dispose();
  }

  // 创建新图表
  tempChart = echarts.init(tempChartRef.value);
  salinityChart = echarts.init(salinityChartRef.value);

  // 设置图表选项
  const tempOption = chartOptions('温度剖面图', 'temperature');
  const salinityOption = chartOptions('盐度剖面图', 'salinity');

  console.log('温度图表数据:', tempOption.dataset.source);
  console.log('盐度图表数据:', salinityOption.dataset.source);

  tempChart.setOption(tempOption);
  salinityChart.setOption(salinityOption);

  // 添加窗口大小变化监听
  const resizeHandler = () => {
    tempChart?.resize();
    salinityChart?.resize();
  };

  window.addEventListener('resize', resizeHandler);

  // 清理函数
  onUnmounted(() => {
    window.removeEventListener('resize', resizeHandler);
    tempChart?.dispose();
    salinityChart?.dispose();
  });
}

// 切换标签页
const switchTab = (tab) => {
  activeTab.value = tab;
  if (tab === 'chart') {
    nextTick(() => {
      // 如果有选中的浮标和数据，则绘制图表
      if (selectedBuoy.value && coreData.value.length > 0) {
        initCharts();
      } else if (selectedBuoy.value) {
        // 如果有选中的浮标但没有数据，重新获取数据
        fetchCoreData(store.platformNumber, selectedBuoy.value.cycleNumber);
      }
    });
  }
}

// 尝试其他周期的数据
const tryOtherCycles = () => {
  // 切换到列表标签页，让用户选择其他周期
  activeTab.value = 'list';
  // 滚动到浮标列表顶部
  nextTick(() => {
    const scrollContainer = document.querySelector('.scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  });
}

// 重试加载数据
const retryLoad = () => {
  if (selectedBuoy.value) {
    errorMessage.value = null; // 清除错误信息
    fetchCoreData(store.platformNumber, selectedBuoy.value.cycleNumber);
  }
}

// 监控 platformNumber，自动加载元信息和浮标列表
watch(platformNumber, (newVal) => {
  if (newVal) {
    loadBuoyList(newVal);
    loadMetaInfo(newVal);
  }
})

// 监听核心数据变化，自动更新图表
watch(coreData, (newData) => {
  if (newData.length > 0 && activeTab.value === 'chart') {
    nextTick(() => {
      initCharts();
    });
  }
}, {deep: true});

// 监听标签页切换，清除错误信息
watch(activeTab, (newTab) => {
  // 切换标签页时清除错误信息
  errorMessage.value = null;
});

// 初始化时加载
onMounted(() => {
  if (platformNumber.value) {
    loadBuoyList(platformNumber.value);
    loadMetaInfo(platformNumber.value);
  }
})


// 关闭面板
const closePanel = () => router.push('/mainview')
// 监听平台编号变化，自动同步
watch(() => store.platformNumber, (newVal) => {
  if (newVal) {
    selectedBuoy.value = newVal
  } else {
    selectedBuoy.value = ''
  }
});

// 页面加载时同步
onMounted(() => {
  if (store.platformNumber) {
    selectedBuoy.value = store.platformNumber
    loadBuoyList(store.platformNumber)  // 加载列表
    loadMetaInfo(store.platformNumber)
  }
});
</script>
<style scoped>
.argo-info-panel {
  position: relative;
  height: 100%;
  padding: 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-radius: 12px;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1001;
  padding: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.close-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: rotate(90deg) scale(1.1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.tab-nav {
  display: flex;
  border-bottom: 2px solid #e9ecef;
  flex-shrink: 0;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tab-nav button {
  flex: 1;
  padding: 16px 20px;
  border: none;
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.tab-nav button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.tab-nav button:hover::before {
  left: 100%;
}

.tab-nav button.active {
  background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
  color: white;
  border-bottom: 3px solid #00b894;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  margin: 0 -20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
}

.scroll-container::-webkit-scrollbar {
  width: 8px;
}

.scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a9eff 0%, #0770c7 100%);
}

.buoy-list {
  display: grid;
  gap: 16px;
  padding-right: 12px;
}

.buoy-item {
  padding: 20px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.buoy-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.buoy-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #74b9ff;
}

.buoy-item:hover::before {
  transform: scaleY(1);
}

.buoy-item.selected {
  border-color: #00b894;
  background: linear-gradient(135deg, #f0fff4 0%, #e8f5e8 100%);
  box-shadow: 0 4px 20px rgba(0, 184, 148, 0.2);
}

.buoy-item.selected::before {
  background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
  transform: scaleY(1);
}

.buoy-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  align-items: center;
}

.platform-number {
  font-weight: 600;
  color: #2d3436;
  font-size: 16px;
}

.cycle-number {
  color: #636e72;
  font-size: 14px;
  background: #f8f9fa;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.data-status {
  font-size: 16px;
  margin-left: 8px;
}

.data-status.has-data {
  color: #28a745;
}

.data-status.no-data {
  color: #dc3545;
}

.data-hint {
  color: #dc3545;
  font-size: 12px;
  font-style: italic;
  margin-top: 4px;
}

.buoy-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #636e72;
  font-size: 14px;
}

.buoy-info span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.buoy-info span::before {
  content: '📍';
  font-size: 12px;
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #74b9ff;
  transition: all 0.3s ease;
}

.metadata-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.metadata-item label {
  color: #636e72;
  margin-right: 20px;
  font-weight: 600;
  font-size: 14px;
  min-width: 80px;
}

.metadata-item span {
  color: #2d3436;
  font-weight: 500;
  text-align: right;
  flex: 1;
}

.full-width {
  grid-column: 1 / -1;
}

.no-selection {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #636e72;
  font-size: 16px;
  gap: 16px;
}

.no-selection::before {
  content: '📋';
  font-size: 48px;
  opacity: 0.5;
}

.chart-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
  width: 100%;
  padding: 20px 0;
}

.chart {
  height: 450px;
  width: 100%;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.chart-notice {
  padding: 20px;
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  color: #856404;
  border-radius: 10px;
  margin-top: 20px;
  text-align: center;
  border-left: 4px solid #fdcb6e;
  font-weight: 500;
}

.chart-notice.no-data {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #6c757d;
  border-left: 4px solid #6c757d;
  padding: 40px 20px;
}

.no-data-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.no-data h3 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 18px;
}

.no-data p {
  margin: 8px 0;
  color: #6c757d;
  font-size: 14px;
}

.no-data .suggestion {
  color: #17a2b8;
  font-weight: 500;
  margin-top: 16px;
}

.no-data-actions {
  margin-top: 20px;
}

.try-other-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
}

.try-other-btn:hover {
  background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.4);
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #fdcb6e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px auto;
}

.chart-info {
  padding: 16px;
  background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
  color: #0c5460;
  border-radius: 10px;
  margin-top: 20px;
  text-align: center;
  border-left: 4px solid #17a2b8;
  font-weight: 500;
  font-size: 14px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  border-radius: 12px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #74b9ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(116, 185, 255, 0.3);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #ff7675 0%, #d63031 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(214, 48, 49, 0.3);
  z-index: 1000;
  text-align: center;
  max-width: 80%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
}

.error-message button {
  margin-top: 16px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.error-message button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .argo-info-panel {
    padding: 16px;
    gap: 16px;
  }

  .chart {
    height: 350px;
    padding: 16px;
  }

  .metadata-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .buoy-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .metadata-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .metadata-item span {
    text-align: left;
  }
}
</style>