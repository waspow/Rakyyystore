
import * as Cesium from "cesium";
import {Color} from "cesium";

class CesiumBegin {
    static cbing(container, baseurl = '/assets/cesium', extend = false) {
        window.CESIUM_BASE_URL = baseurl;
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0Yjk3ZWJmNS0xOTBjLTRmMmEtYWU5OS1jYTcwNDYyMTQ0M2QiLCJpZCI6MjQwNDA2LCJpYXQiOjE3MjU5NjI1MjR9.FAapDekqXStmupf5maCNd9EBfezA9NEk8t9YmxJjAn8';

        const options = {
            sceneMode: 3,
            infoBox: false,
            vrButton: false,
            geocoder: false,
            timeline: false,
            baseLayer: false,
            animation: false,
            homeButton: false,
            shouldAnimate: true,
            baseLayerPicker: false,
            sceneModePicker: false,
            imageryProvider: false,
            fullscreenButton: false,
            projectionPicker: false,
            selectionIndicator: true,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,
        };

        const viewer = new Cesium.Viewer(container, options);

        // 隐藏Cesium标志的核心代�?
        viewer.cesiumWidget.creditContainer.style.display = "none"; // 添加这行

        if (extend) {
            viewer.extend(Cesium.viewerDragDropMixin);
            viewer.extend(Cesium.viewerPerformanceWatchdogMixin);
            viewer.extend(Cesium.viewerCesiumInspectorMixin);
        }

        viewer.scene.globe.baseColor = Color.TRANSPARENT;
        viewer.scene.skyAtmosphere.show = false;

        return viewer;
    }
}

export default CesiumBegin;
