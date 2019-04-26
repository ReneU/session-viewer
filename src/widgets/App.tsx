import esri = __esri;

import {
  aliasOf,
  declared,
  property,
  subclass
} from "esri/core/accessorSupport/decorators";
import { tsx } from "esri/widgets/support/widget";

import EsriMap from "esri/Map";
import MapView from "esri/views/MapView";
import Widget from "esri/widgets/Widget";

import AppViewModel, { AppParams } from "./App/AppViewModel";

import { Header } from "./Header";

interface AppViewParams extends AppParams, esri.WidgetProperties {}

const CSS = {
  base: "main",
  container: "webmap-container",
  webmapLeft: "webmap-left",
  webmapRight: "webmap-right"
};

@subclass("app.widgets.App")
export default class App extends declared(Widget) {
  @property() viewModel = new AppViewModel();

  @aliasOf("viewModel.appName") appName: string;

  @aliasOf("viewModel.map") map: EsriMap;

  @aliasOf("viewModel.view") view: MapView;

  constructor(params: Partial<AppViewParams>) {
    super(params);
  }

  render() {
    return (
      <div class={CSS.base}>
        {Header({ appName: this.appName })}
        <div class={CSS.container}>
          <div class={CSS.webmapLeft} bind={this} afterCreate={this.onAfterCreate} />
          <div class={CSS.webmapRight} bind={this} afterCreate={this.onAfterCreate} />
        </div>
      </div>
    );
  }

  private onAfterCreate(element: HTMLDivElement) {
    const map = new EsriMap({
      basemap: "topo"
    });
    this.map = map;
    this.view = new MapView({
      map: this.map,
      container: element
    });
  }
}
