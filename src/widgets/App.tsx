import esri = __esri;
import config from "../appConfig";


import {
  declared,
  property,
  subclass
} from "esri/core/accessorSupport/decorators";
import { tsx } from "esri/widgets/support/widget";
import {watch, whenTrue} from "esri/core/watchUtils";
import GraphicsLayer from "esri/layers/GraphicsLayer";
import FeatureLayer from "esri/layers/FeatureLayer";
import MapView from "esri/views/MapView";
import Widget from "esri/widgets/Widget";
import EsriMap from "esri/Map";

import { Header } from "./Header";
import HistogramSlider from "./HistogramSlider";
import TableOfContents from './TableOfContents';
import LayerFactory from '../data/LayerFactory';
import InteractionLayer from '../data/InteractionLayer';

interface AppViewParams extends esri.WidgetProperties {}

const CSS = {
  base: "main",
  container: "webmap-container",
  containerLeft: "webmap-container-left",
  containerRight: "webmap-container-right",
  webmapHeader: "webmap-header",
  webmapLeft: "webmap-left",
  webmapRight: "webmap-right"
};

@subclass("app.widgets.App")
export default class App extends declared(Widget) {
  private mapLeft: EsriMap;
  private mapRight: EsriMap;
  private viewLeft: MapView;
  private viewRight: MapView;
  private layerLeft: FeatureLayer;
  private layerRight: FeatureLayer;
  private sliderLeft: HistogramSlider;
  private sliderRight: HistogramSlider;

  constructor(params: AppViewParams) {
    super(params);
    const appIds = config.appIds;
    this.mapLeft = new EsriMap({basemap: config.basemap});
    this.mapRight = new EsriMap({basemap: config.basemap});
    const viewLeft = this.viewLeft = new MapView({
      extent: config.initialExtent,
      map: this.mapLeft,
      constraints: {
        rotationEnabled: false
      }
    });
    viewLeft.ui.components = [];
    const tableOfContents = new TableOfContents({view: viewLeft});
    viewLeft.ui.add(tableOfContents.getWidget(), "top-left");
    const viewRight = this.viewRight = new MapView({
      extent: config.initialExtent,
      map: this.mapRight,
      constraints: {
        rotationEnabled: false
      }
    });
    viewRight.ui.components = [];

    const dataProvider = new LayerFactory(appIds);

    dataProvider.createSessionTracksLayer(appIds[0]).then((layer: GraphicsLayer) => this.mapLeft.add(layer));
    dataProvider.createCharacteristicPointsLayer(appIds[0]).then((layer: GraphicsLayer) => this.mapLeft.add(layer));
    const layerLeftReady = dataProvider.createInteractionPointsLayer(appIds[0])
      .then((layer: FeatureLayer) => {
        this.mapLeft.add(layer);
        this.layerLeft = layer;
      });
    dataProvider.createSessionTracksLayer(appIds[1]).then((layer: GraphicsLayer) => this.mapRight.add(layer));
    dataProvider.createCharacteristicPointsLayer(appIds[1]).then((layer: GraphicsLayer) => this.mapRight.add(layer));
    const layerRightReady = dataProvider.createInteractionPointsLayer(appIds[1])
      .then((layer: FeatureLayer) => {
        this.mapRight.add(layer);
        this.layerRight = layer;
      });
    Promise.all([layerLeftReady, layerRightReady, this.viewLeft.when(), this.viewRight.when()])
      .then(() => this.onViewsReady());
  }

  render() {
    return (
      <div class={CSS.base}>
        {Header({ appName: config.appName })}
        <div class={CSS.container}>
          <div class={CSS.containerLeft}>
            <div class={CSS.webmapHeader}>{config.scenarioA}</div>
            <div class={CSS.webmapLeft} bind={this} afterCreate={this.onLeftReady} />
          </div>
          <div class={CSS.containerRight}>
            <div class={CSS.webmapHeader}>{config.scenarioB}</div>
            <div class={CSS.webmapRight} bind={this} afterCreate={this.onRightReady} />
          </div>
        </div>
      </div>
    );
  }

  private onLeftReady(element: HTMLDivElement) {
    this.viewLeft.container = element;
  }

  private onRightReady(element: HTMLDivElement) {
    this.viewRight.container = element;
  }

  private onViewsReady(){
    this.initializeHistogramSliders();
    this.synchronizeMaps();
    this.synchronizeViews();
  }

  private initializeHistogramSliders() {
    this.sliderLeft = this.initializeHistogramSlider({layer: this.layerLeft, view: this.viewLeft, position: "left"});
    this.sliderRight = this.initializeHistogramSlider({layer: this.layerRight, view: this.viewRight, position: "right"});
  }

  private initializeHistogramSlider({view, layer, position}: {view: MapView, layer: FeatureLayer, position: string}){
    const nodeId = `slider-${position}`;
    const viewPosition = `bottom-${position}`;
    const slider = new HistogramSlider({layer, view, nodeId});
    slider.onWidgetReady = () => {
      view.ui.add(nodeId + "-container", viewPosition);
    };
    slider.onRendererChange = renderer => {
      layer.renderer = renderer;
    }
    slider.visible = layer.visible;
    return slider;
  }

  private synchronizeMaps() {
    const mapLeft = this.viewLeft.map;
    const mapRight = this.viewRight.map;
    this.synchronizeLayers(mapLeft, this.sliderLeft, mapRight);
    this.synchronizeLayers(mapRight, this.sliderRight, mapLeft);
  }

  private synchronizeLayers(sourceMap: EsriMap, sourceSlider: HistogramSlider, targetMap: EsriMap) {
    sourceMap.allLayers.forEach(layer => {
      const isInteractionLayer = layer instanceof InteractionLayer;
      // sync visibility of all layers
      layer.watch("visible", visible => {
        // sync all target layers;
        targetMap.layers.find(targetLayer => {
          return targetLayer.id === layer.id;
        }).visible = visible;
        // disable all other layers
        if(visible){
          sourceMap.layers.forEach(targetLayer => {
            targetLayer.visible = targetLayer.id === layer.id;
          });
        }
        this.updateSlider(sourceMap, sourceSlider);
      });

      // sync rendererField of interaction layers
      if(isInteractionLayer){
        layer.watch("rendererField", value => {
          const interactionLayer = targetMap.layers.find(targetLayer => {
            return targetLayer.id === layer.id;
          }) as InteractionLayer;
          interactionLayer.rendererField = value;
        })
      }
    });
  }

  private updateSlider(map: EsriMap, slider: HistogramSlider){
      const visibleLayer = map.layers.find(layer => layer.visible);
      if(!visibleLayer) return;
      const sliderVisibility = visibleLayer instanceof InteractionLayer;
      slider.visible = sliderVisibility;
      if(!sliderVisibility) return;
      slider.layer = visibleLayer as InteractionLayer;
  }

  private synchronizeViews () {
    this.synchronizeView(this.viewLeft, this.viewRight);
    this.synchronizeView(this.viewRight, this.viewLeft);
  };

  private synchronizeView(source: MapView, target: MapView){
    let viewpointWatchHandle: esri.WatchHandle | null;
    let viewStationaryHandle: esri.WatchHandle | null;
    let otherInteractHandler: esri.WatchHandle | null;
    let scheduleId: NodeJS.Timeout | null;

    var clear = function() {
      if (otherInteractHandler) {
        otherInteractHandler.remove();
      }
      viewpointWatchHandle && viewpointWatchHandle.remove();
      viewStationaryHandle && viewStationaryHandle.remove();
      scheduleId && clearTimeout(scheduleId);
      otherInteractHandler = viewpointWatchHandle = viewStationaryHandle = scheduleId = null;
    };

    var interactWatcher = source.watch("interacting,animation", function(newValue) {
      if (!newValue) {
        return;
      }
      if (viewpointWatchHandle || scheduleId) {
        return;
      }

      // start updating the other views at the next frame
      scheduleId = setTimeout(function() {
        scheduleId = null;
        viewpointWatchHandle = source.watch("viewpoint", function(newValue) {
          target.viewpoint = newValue;
        });
      }, 0);

      // stop as soon as another view starts interacting, like if the user starts panning
      otherInteractHandler = watch(target, "interacting,animation", function(value) {
        if (value) {
          clear();
        }
      });

      // or stop when the view is stationary again
      viewStationaryHandle = whenTrue(source, "stationary", clear);
    });

    return {
      remove: function() {
        this.remove = function() {};
        clear();
        interactWatcher.remove();
      }
    };
  };
}