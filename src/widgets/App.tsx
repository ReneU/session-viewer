import esri = __esri;

import {
  declared,
  property,
  subclass
} from "esri/core/accessorSupport/decorators";
import { tsx } from "esri/widgets/support/widget";
import EsriMap from "esri/Map";
import MapView from "esri/views/MapView";
import Widget from "esri/widgets/Widget";

import { Header } from "./Header";

export interface AppParams {
  appName: string;
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
  @property() mapLeft = new EsriMap();
  @property() mapRight = new EsriMap();
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
      basemap: "topo"
    });
    this.mapLeft = map;
    this.viewLeft = new MapView({
      map: this.mapLeft,
      container: element
    });
  }

  private onRightReady(element: HTMLDivElement) {
    const map = new EsriMap({
      basemap: "topo"
    });
    this.mapRight = map;
    this.viewRight = new MapView({
      map: this.mapRight,
      container: element
    });
  }
}