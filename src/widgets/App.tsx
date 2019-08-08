import esri = __esri;
import config from "../appConfig";

import { declared, subclass } from "esri/core/accessorSupport/decorators";
import { watch, whenTrue } from "esri/core/watchUtils";
import GraphicsLayer from "esri/layers/GraphicsLayer";
import EsriMap from "esri/Map";
import MapView from "esri/views/MapView";
import { tsx } from "esri/widgets/support/widget";
import Widget from "esri/widgets/Widget";

import GeometryLayer from "../data/GeometryLayer";
import InteractionsLayer from "../data/InteractionsLayer";
import LayerFactory from "../data/LayerFactory";
import Description from "./Description";
import { Header } from "./Header";
import HistogramSlider from "./HistogramSlider";
import RelationshipLegend from "./RelationshipLegend";
import TableOfContents from "./TableOfContents";

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
  private legendLeft: RelationshipLegend;
  private legendRight: RelationshipLegend;
  private descriptionWidget: Description;

  constructor(params: AppViewParams) {
    super(params);
    const appIds = config.appIds;
    const mapLeft = new EsriMap({ basemap: config.basemap });
    const mapRight = new EsriMap({ basemap: config.basemap });

    const leftView = (this.viewLeft = this.createView(mapLeft));
    const rightView = (this.viewRight = this.createView(mapRight));
    //const descriptionWidget = (this.descriptionWidget = new Description());
    //rightView.ui.add(descriptionWidget, "top-right");

    const layerFactory = new LayerFactory(appIds);
    mapLeft.add(LayerFactory.createTaskGeometriesLayer());
    const layersReady = [];
    layersReady.push(
      layerFactory
        .createSummarizedMovesLayer(appIds[0])
        .then((layer: GraphicsLayer) => mapLeft.add(layer))
    );
    layersReady.push(
      layerFactory
        .createInteractionPointsLayer(appIds[0])
        .then((layer: GeometryLayer) => mapLeft.add(layer))
    );
    mapRight.add(LayerFactory.createTaskGeometriesLayer());
    layersReady.push(
      layerFactory
        .createSummarizedMovesLayer(appIds[1])
        .then((layer: GraphicsLayer) => mapRight.add(layer))
    );
    layersReady.push(
      layerFactory
        .createInteractionPointsLayer(appIds[1])
        .then((layer: GeometryLayer) => mapRight.add(layer))
    );
    Promise.all([leftView.when(), rightView.when(), ...layersReady]).then(
      () => {
        const tableOfContents = new TableOfContents({ view: leftView });
        leftView.ui.add(tableOfContents.getWidget(), "top-left");

        this.initializeRelationshipLegends(leftView, rightView);
        this.initializeHistogramSliders(leftView, rightView);
        this.synchronizeMaps(leftView, rightView);
        this.synchronizeViews(leftView, rightView);
      }
    );
  }

  render() {
    return (
      <div class={CSS.base}>
        {Header({ appName: config.appName })}
        <div class={CSS.container}>
          <div class={CSS.containerLeft}>
            <div class={CSS.webmapHeader}>{config.scenarioA}</div>
            <div
              class={CSS.webmapLeft}
              bind={this}
              afterCreate={this.onLeftReady}
            />
          </div>
          <div class={CSS.containerRight}>
            <div class={CSS.webmapHeader}>{config.scenarioB}</div>
            <div
              class={CSS.webmapRight}
              bind={this}
              afterCreate={this.onRightReady}
            />
          </div>
        </div>
      </div>
    );
  }

  private createView(map: EsriMap) {
    const view = new MapView({
      map,
      extent: config.initialExtent,
      constraints: {
        rotationEnabled: false
      }
    });
    view.ui.components = [];
    return view;
  }

  private onLeftReady(element: HTMLDivElement) {
    this.viewLeft.container = element;
  }

  private onRightReady(element: HTMLDivElement) {
    this.viewRight.container = element;
  }

  private initializeRelationshipLegends(leftView: MapView, rightView: MapView) {
    this.legendLeft = this.initializeRelationshipLegend(leftView);
    this.legendRight = this.initializeRelationshipLegend(rightView);
  }

  private initializeRelationshipLegend(view: MapView) {
    const legend = new RelationshipLegend({ view });
    if (legend.visible) {
      view.ui.add(legend.widget, "bottom-left");
    }
    legend.watch("visible", visible => {
      if (!visible) {
        view.ui.remove(legend.widget);
        return;
      }
      view.ui.add(legend.widget, "bottom-left");
    });
    return legend;
  }

  private initializeHistogramSliders(leftView: MapView, rightView: MapView) {
    this.sliderLeft = this.initializeHistogramSlider({
      view: leftView,
      position: "left"
    });
    this.sliderRight = this.initializeHistogramSlider({
      view: rightView,
      position: "right"
    });
    this.syncHistogramSliderThemes(this.sliderLeft, this.sliderRight);
  }

  private initializeHistogramSlider({
    view,
    position
  }: {
    view: MapView;
    position: string;
  }) {
    const nodeId = `slider-${position}`;
    const slider = new HistogramSlider({ view, nodeId });
    const node = document.getElementById(nodeId + "-container")!;
    if (slider.visible) {
      view.ui.add(node, "bottom-left");
    }
    slider.watch("visible", visible => {
      if (!visible) {
        view.ui.remove(node);
        return;
      }
      view.ui.add(node, "bottom-left");
    });
    return slider;
  }

  private syncHistogramSliderThemes(
    first: HistogramSlider,
    second: HistogramSlider
  ) {
    first.watch("theme", theme => (second.theme = theme));
    second.watch("theme", theme => (first.theme = theme));
  }

  private synchronizeMaps(leftView: MapView, rightView: MapView) {
    const mapLeft = leftView.map;
    const mapRight = rightView.map;
    this.observeLayerChanges(
      mapLeft,
      mapRight,
      this.sliderLeft,
      this.legendLeft
    );
    this.observeLayerChanges(
      mapRight,
      mapLeft,
      this.sliderRight,
      this.legendRight
    );
  }

  private observeLayerChanges(
    sourceMap: EsriMap,
    targetMap: EsriMap,
    sourceSlider: HistogramSlider,
    sourceLegend: RelationshipLegend
  ) {
    sourceMap.allLayers.forEach(layer => {
      // sync visibility of all layers
      layer.watch("visible", visible => {
        // sync all target layers;
        targetMap.layers.find(targetLayer => {
          return targetLayer.id === layer.id;
        }).visible = visible;
        if (!(layer instanceof GeometryLayer)) { return; }
        if (visible) {
          sourceMap.layers.forEach(targetLayer => {
            if (!(targetLayer instanceof GeometryLayer)) { return; }
            targetLayer.visible = targetLayer.id === layer.id;
          });
        }
        this.updateUI(sourceMap, sourceSlider, sourceLegend);
        //this.updateDescriptionState(sourceMap);
      });

      // sync rendererFields of interaction layers
      layer.watch("rendererFields", value => {
        const interactionLayer = targetMap.layers.find(targetLayer => {
          return targetLayer.id === layer.id;
        }) as GeometryLayer;
        interactionLayer.rendererFields = value;
        //this.updateDescriptionState(sourceMap);
      });
    });
  }

  private updateUI(
    map: EsriMap,
    slider: HistogramSlider,
    legend: RelationshipLegend
  ) {
    const visibleLayer = map.layers.find(
      layer => layer.visible && layer instanceof GeometryLayer
    ) as GeometryLayer;
    slider.layer = visibleLayer;
    legend.layer = visibleLayer;
  }

  private updateDescriptionState(map: EsriMap) {
    const layer = map.layers.find(
      layer => layer.visible && layer instanceof GeometryLayer
    ) as GeometryLayer;
    this.descriptionWidget.state = layer
      ? layer instanceof InteractionsLayer
        ? (layer as InteractionsLayer).rendererFields.length > 1
          ? "interactionRelationship"
          : "interactionSlider"
        : "aggregatedTracks"
      : "start";
  }

  private synchronizeViews(leftView: MapView, rightView: MapView) {
    this.synchronizeView(leftView, rightView);
    this.synchronizeView(rightView, leftView);
  }

  private synchronizeView(source: MapView, target: MapView) {
    let viewpointWatchHandle: esri.WatchHandle | null;
    let viewStationaryHandle: esri.WatchHandle | null;
    let otherInteractHandler: esri.WatchHandle | null;
    let scheduleId: NodeJS.Timeout | null;

    let clear = function() {
      if (otherInteractHandler) {
        otherInteractHandler.remove();
      }
      viewpointWatchHandle && viewpointWatchHandle.remove();
      viewStationaryHandle && viewStationaryHandle.remove();
      scheduleId && clearTimeout(scheduleId);
      otherInteractHandler = viewpointWatchHandle = viewStationaryHandle = scheduleId = null;
    };

    let interactWatcher = source.watch("interacting,animation", function(
      newValue
    ) {
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
      otherInteractHandler = watch(target, "interacting,animation", function(
        value
      ) {
        if (value) {
          clear();
        }
      });

      // or stop when the view is stationary again
      viewStationaryHandle = whenTrue(source, "stationary", clear);
    });

    return {
      remove() {
        this.remove = function() {};
        clear();
        interactWatcher.remove();
      }
    };
  }
}
