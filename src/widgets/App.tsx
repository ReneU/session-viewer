import esri = __esri;
import config from "../appConfig";


import {
  declared,
  subclass
} from "esri/core/accessorSupport/decorators";
import { tsx } from "esri/widgets/support/widget";
import {watch, whenTrue} from "esri/core/watchUtils";
import GraphicsLayer from "esri/layers/GraphicsLayer";
import MapView from "esri/views/MapView";
import Widget from "esri/widgets/Widget";
import EsriMap from "esri/Map";

import { Header } from "./Header";
import HistogramSlider from "./HistogramSlider";
import TableOfContents from './TableOfContents';
import LayerFactory from '../data/LayerFactory';
import GeometryLayer from '../data/GeometryLayer';
import RelationshipLegend from './RelationshipLegend';

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
  private viewLeft: MapView;
  private viewRight: MapView;
  private sliderLeft: HistogramSlider;
  private sliderRight: HistogramSlider;
  private legend: RelationshipLegend;

  constructor(params: AppViewParams) {
    super(params);
    const appIds = config.appIds;
    const mapLeft = new EsriMap({basemap: config.basemap});
    const mapRight = new EsriMap({basemap: config.basemap});
    
    const leftView = this.viewLeft = this.createView(mapLeft);
    const tableOfContents = new TableOfContents({view: leftView});
    leftView.ui.add(tableOfContents.getWidget(), "top-left");
    const rightView = this.viewRight = this.createView(mapRight);

    const layerFactory = new LayerFactory(appIds);
    mapLeft.add(LayerFactory.createTaskGeometriesLayer());
    layerFactory.createSummarizedMovesLayer(appIds[0]).then((layer: GraphicsLayer) => mapLeft.add(layer));
    layerFactory.createInteractionPointsLayer(appIds[0]).then((layer: GeometryLayer) => mapLeft.add(layer));
    mapRight.add(LayerFactory.createTaskGeometriesLayer());
    layerFactory.createSummarizedMovesLayer(appIds[1]).then((layer: GraphicsLayer) => mapRight.add(layer));
    layerFactory.createInteractionPointsLayer(appIds[1]).then((layer: GeometryLayer) => mapRight.add(layer));
    Promise.all([leftView.when(), rightView.when()]).then(() => {
      this.initializeRelationshipLegend(leftView);
      this.initializeHistogramSliders(leftView, rightView);
      this.synchronizeMaps(leftView, rightView);
      this.synchronizeViews(leftView, rightView);
    });
  }

  private createView (map: EsriMap){
    const view = new MapView({
      map, extent: config.initialExtent,
      constraints: {
        rotationEnabled: false
      }
    });
    view.ui.components = [];
    return view;
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

  private initializeRelationshipLegend(view: MapView) {
    const legend = new RelationshipLegend({view});
    if(legend.visible) {
      view.ui.add(legend.widget, "top-right");
    }
    legend.watch("visible", visible => {
      if(!visible) {
        view.ui.remove(legend.widget);
        return;
      }
      view.ui.add(legend.widget, "top-right");
    });
    this.legend = legend;
  }

  private initializeHistogramSliders(leftView: MapView, rightView: MapView) {
    this.sliderLeft = this.initializeHistogramSlider({view: leftView, position: "left"});
    this.sliderRight = this.initializeHistogramSlider({view: rightView, position: "right"});
    this.syncHistogramSliderThemes(this.sliderLeft, this.sliderRight);
  }

  private initializeHistogramSlider({view, position}: {view: MapView, position: string}){
    const nodeId = `slider-${position}`;
    const slider = new HistogramSlider({view, nodeId});
    slider.onWidgetReady = () => {
      view.ui.add(nodeId + "-container", "bottom-left");
    };
    return slider;
  }

  private syncHistogramSliderThemes(first: HistogramSlider, second: HistogramSlider) {
    first.watch("theme", theme => second.theme = theme);
    second.watch("theme", theme => first.theme = theme);
  }

  private synchronizeMaps(leftView: MapView, rightView: MapView) {
    const mapLeft = leftView.map;
    const mapRight = rightView.map;
    this.synchronizeLayers(mapLeft, this.sliderLeft, mapRight);
    this.synchronizeLayers(mapRight, this.sliderRight, mapLeft);
  }

  private synchronizeLayers(sourceMap: EsriMap, sourceSlider: HistogramSlider, targetMap: EsriMap) {
    sourceMap.allLayers.forEach(layer => {
      // sync visibility of all layers
      layer.watch("visible", visible => {
        // sync all target layers;
        targetMap.layers.find(targetLayer => {
          return targetLayer.id === layer.id;
        }).visible = visible;
        if(!(layer instanceof GeometryLayer)) return;
        if(visible){
          sourceMap.layers.forEach(targetLayer => {
            if(!(targetLayer instanceof GeometryLayer)) return;
            targetLayer.visible = targetLayer.id === layer.id;
          });
        }
        this.updateUI(sourceMap, sourceSlider);
      });

      // sync rendererField of interaction layers
      layer.watch("rendererField", value => {
        const interactionLayer = targetMap.layers.find(targetLayer => {
          return targetLayer.id === layer.id;
        }) as GeometryLayer;
        interactionLayer.rendererField = value;
      })
    });
  }

  private updateUI(map: EsriMap, slider: HistogramSlider){
      const visibleLayer = map.layers.find(layer => layer.visible && layer instanceof GeometryLayer) as GeometryLayer;
      slider.layer = visibleLayer;
      this.legend.layer = visibleLayer;
  }

  private synchronizeViews (leftView: MapView, rightView: MapView) {
    this.synchronizeView(leftView, rightView);
    this.synchronizeView(rightView, leftView);
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