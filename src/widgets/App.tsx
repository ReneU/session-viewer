import esri = __esri;

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
import Extent from "esri/geometry/Extent";
import EsriMap from "esri/Map";

import { Header } from "./Header";
import HistogramSlider from "./HistogramSlider";
import TableOfContents from './TableOfContents';
import LayerFactory from '../data/LayerFactory';

export interface AppParams {
  appName: string;
  basemap: string;
  initialExtent: Extent;
  appIds: string[];
}

interface AppViewParams extends AppParams, esri.WidgetProperties {}

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
  @property() appName: string;
  @property() initialExtent: Extent;
  @property() mapLeft: EsriMap;
  @property() mapRight: EsriMap;
  @property() viewLeft: MapView;
  @property() viewRight: MapView;
  @property() layerLeft: FeatureLayer;
  @property() layerRight: FeatureLayer;
  @property() histogramSlider: HistogramSlider;

  constructor(params: AppViewParams) {
    super(params);
    this.mapLeft = new EsriMap({basemap: params.basemap});
    this.mapRight = new EsriMap({basemap: params.basemap});
    const viewLeft = this.viewLeft = new MapView({
      extent: params.initialExtent,
      map: this.mapLeft,
      constraints: {
        rotationEnabled: false
      }
    });
    viewLeft.ui.components = [];
    const tableOfContents = new TableOfContents({view: viewLeft});
    viewLeft.ui.add(tableOfContents.getWidget(), "top-left");
    const viewRight = this.viewRight = new MapView({
      extent: params.initialExtent,
      map: this.mapRight,
      constraints: {
        rotationEnabled: false
      }
    });
    viewRight.ui.components = [];

    const dataProvider = new LayerFactory(params.appIds);

    dataProvider.createSessionTracksLayer(params.appIds[0]).then((layer: GraphicsLayer) => this.mapLeft.add(layer));
    dataProvider.createCharacteristicPointsLayer(params.appIds[0], viewLeft).then((layer: GraphicsLayer) => this.mapLeft.add(layer));
    const layerLeftReady = dataProvider.createInteractionPointsLayer(params.appIds[0])
      .then((layer: FeatureLayer) => {
        this.mapLeft.add(layer);
        this.layerLeft = layer;
      });
    dataProvider.createSessionTracksLayer(params.appIds[1]).then((layer: GraphicsLayer) => this.mapRight.add(layer));
    dataProvider.createCharacteristicPointsLayer(params.appIds[1], viewRight).then((layer: GraphicsLayer) => this.mapRight.add(layer));
    const layerRightReady = dataProvider.createInteractionPointsLayer(params.appIds[1])
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
        {Header({ appName: this.appName })}
        <div class={CSS.container}>
          <div class={CSS.containerLeft}>
            <div class={CSS.webmapHeader}>{"Scenario A"}</div>
            <div class={CSS.webmapLeft} bind={this} afterCreate={this.onLeftReady} />
          </div>
          <div class={CSS.containerRight}>
            <div class={CSS.webmapHeader}>{"Scenario B"}</div>
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
    this.initializeHistogramSlider({layer: this.layerLeft, field: "sessionTime", view: this.viewLeft, position: "left"});
    this.initializeHistogramSlider({layer: this.layerRight, field: "sessionTime", view: this.viewRight, position: "right"});
  }

  private initializeHistogramSlider({view, layer, field, position}: {view: MapView, layer: FeatureLayer, field: string, position: string}){
    const nodeId = `slider-${position}`;
    const viewPosition = `bottom-${position}`;
    const slider = new HistogramSlider({layer, field, view, nodeId});
    slider.onWidgetReady = () => {
      view.ui.add(nodeId + "-container", viewPosition);
    };
    slider.onRendererChange = renderer => {
      layer.renderer = renderer;
    }
    slider.visible = layer.visible;
    layer.watch("visible", value => slider.visible = value);
  }

  private synchronizeMaps() {
    const mapLeft = this.viewLeft.map;
    const mapRight = this.viewRight.map;
    this.synchronizeMap(mapLeft, mapRight);
    this.synchronizeMap(mapRight, mapLeft);
  }

  private synchronizeMap(source: EsriMap, target: EsriMap) {
    source.allLayers.forEach(layer => layer.watch("visible", value => {
      target.allLayers.find(targetLayer => {
        return targetLayer.id === layer.id;
      }).visible = value;
    }))
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