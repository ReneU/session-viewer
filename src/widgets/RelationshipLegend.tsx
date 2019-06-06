import Accessor from "esri/core/Accessor";
import MapView from "esri/views/MapView";
import Legend from "esri/widgets/Legend";
import GeometryLayer from '../data/GeometryLayer';
import {createRenderer} from "esri/renderers/smartMapping/creators/relationship";
import { declared, property, subclass } from "esri/core/accessorSupport/decorators";

import appConfig from '../appConfig';
import { UniqueValueRenderer } from 'esri/renderers';

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
    this.fieldWatchHandle = layer.watch("rendererFields", () => {
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
    const field1 = this.layer.fields.find(field => field.name === layer.rendererFields[0])!;
    const field2 = this.layer.fields.find(field => field.name === layer.rendererFields[1])!;
    const params = {
      layer,
      view: this.view,
      basemap: appConfig.basemap,
      numClasses: 2,
      field1: {
        field: field1.name
      },
      field2: {
        field: field2.name
      },
      focus: "HH",
      defaultSymbolEnabled: false
    };
    
    createRenderer(params)
      .then(function(response){
        const renderer = response.renderer as UniqueValueRenderer;
        layer.renderer = response.renderer;
        renderer.uniqueValueInfos.forEach(info => {
          switch (info.value) {
            case "HH":
              info.label = `High ${field1.alias}, High ${field2.alias}`;
              break;
            case "HL":
              info.label = `High ${field1.alias}, Low ${field2.alias}`;
              break;
            case "LH":
              info.label = `Low ${field1.alias}, High ${field2.alias}`;
              break;
            case "LL":
              info.label = `Low ${field1.alias}, Low ${field2.alias}`;
              break;
          }
        });
      })
      .catch(function(error) {
        console.log("there was an error: ", error);
      });
  }

  private updateVisibility(){
    const layer = this.layer;
    this.visible = layer && layer.rendererFields.length === 2;
  }
}

interface DescriptionParams {
  view: MapView
}