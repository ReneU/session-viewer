import esri = __esri;

import {
  declared,
  property,
  subclass
} from "esri/core/accessorSupport/decorators";
import { tsx } from "esri/widgets/support/widget";
import {watch, whenTrue} from "esri/core/watchUtils";
import EsriMap from "esri/Map";
import MapView from "esri/views/MapView";
import Widget from "esri/widgets/Widget";
import Extent from "esri/geometry/Extent";

import { Header } from "./Header";

export interface AppParams {
  appName: string;
  basemap: string;
  initialExtent: Extent;
}

interface AppViewParams extends AppParams, esri.WidgetProperties {}

const CSS = {
  base: "main",
  container: "webmap-container",
  webmapLeft: "webmap-left",
  webmapRight: "webmap-right"
};

@subclass("app.widgets.App")
export default class App extends declared(Widget) {
  @property() appName: string;
  @property() basemap: string;
  @property() initialExtent: Extent;
  @property() mapLeft: EsriMap;
  @property() mapRight: EsriMap;
  @property() viewLeft: MapView;
  @property() viewRight: MapView;

  constructor(params: Partial<AppViewParams>) {
    super(params);
  }

  render() {
    return (
      <div class={CSS.base}>
        {Header({ appName: this.appName })}
        <div class={CSS.container}>
          <div class={CSS.webmapLeft} bind={this} afterCreate={this.onLeftReady} />
          <div class={CSS.webmapRight} bind={this} afterCreate={this.onRightReady} />
        </div>
      </div>
    );
  }

  private onLeftReady(element: HTMLDivElement) {
    const map = new EsriMap({
      basemap: this.basemap
    });
    this.mapLeft = map;
    this.viewLeft = new MapView({
      map: this.mapLeft,
      extent: this.initialExtent,
      container: element
    });
    this.synchronizeViews();
  }

  private onRightReady(element: HTMLDivElement) {
    const map = new EsriMap({
      basemap: this.basemap
    });
    this.mapRight = map;
    this.viewRight = new MapView({
      map: this.mapRight,
      extent: this.initialExtent,
      container: element
    });
    this.synchronizeViews();
  }

  private synchronizeViews () {
    if(!this.viewLeft || !this.viewRight) return;
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