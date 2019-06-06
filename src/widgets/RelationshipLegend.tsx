import Accessor from "esri/core/Accessor";
import MapView from "esri/views/MapView";
import Legend from "esri/widgets/Legend";
import GeometryLayer from '../data/GeometryLayer';
import {createRenderer} from "esri/renderers/smartMapping/creators/relationship";
import { declared, property, subclass } from "esri/core/accessorSupport/decorators";

import appConfig from '../appConfig';

@subclass("app.widgets.RelationshipLegend")
export default class RelationshipLegend extends declared(Accessor) {

  @property() widget: Legend;
  @property() view: MapView;

  @property() visible: boolean = false;

  @property()
  set layer(layer: GeometryLayer) {
    if(layer && this.layer && layer.id === this.layer.id) return;
    this._set("layer", layer);
    this.updateFieldViewWatchHandle();
  }

  private fieldWatchHandle: any;

  constructor(params: DescriptionParams){
    super();
    this.view = params.view;
    this.createLegend(params.view);
  }

  getWidget(){
    return this.widget;
  }

  private updateFieldViewWatchHandle(){
    if(this.fieldWatchHandle){
      this.fieldWatchHandle.remove();
    }
    const layer = this.layer;
    this.updateVisibility();
    if(!layer) return;
    this.fieldWatchHandle = layer.watch("rendererField", field => {
      this.updateVisibility();
      this.updateRenderer();
    });
    this.updateRenderer();
  }

  private createLegend(view: MapView){
    const legend = new Legend({view});
    this.widget = legend;
  }

  private updateRenderer(){
    if(!this.visible) return;
    const layer = this.layer;
    const params = {
      layer,
      view: this.view,
      basemap: appConfig.basemap,
      field1: {
        field: "zoom"
      },
      field2: {
        field: "pragmaticQuality"
      },
      focus: "HH",
      defaultSymbolEnabled: false
    };
    
    createRenderer(params)
      .then(function(response){
        layer.renderer = response.renderer;
      })
      .catch(function(error) {
        console.log("there was an error: ", error);
      });
  }

  private updateVisibility(){
    const layer = this.layer;
    this.visible = layer && layer.rendererField.toLowerCase().includes("relationship");
  }
}

interface DescriptionParams {
  view: MapView
}