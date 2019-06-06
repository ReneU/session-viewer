import Accessor from "esri/core/Accessor";
import { declared, property, subclass } from "esri/core/accessorSupport/decorators";
import MapView from "esri/views/MapView";
import Legend from "esri/widgets/Legend";
import GeometryLayer from '../data/GeometryLayer';

@subclass("app.widgets.RelationshipLegend")
export default class RelationshipLegend extends declared(Accessor) {

  @property() widget: Legend;

  @property() visible: boolean = false;

  @property()
  set layer(layer: GeometryLayer) {
    if(this.layer && layer.id === this.layer.id) return;
    this._set("layer", layer);
    this.updateFieldViewWatchHandle();
  }

  private fieldWatchHandle: any;

  constructor(params: DescriptionParams){
    super();
    this.updateFieldViewWatchHandle();
    this.createLegend(params.view);
  }

  getWidget(){
    return this.widget;
  }

  private updateFieldViewWatchHandle(){
    if(this.fieldWatchHandle){
      this.fieldWatchHandle.remove();
    }
    if(!this.layer) {
      return;
    }
    this.fieldWatchHandle = this.layer.watch("rendererField", field => {
      this.visible = field.toLowerCase().includes("scale");
    });
  }

  private createLegend(view: MapView){
    const legend = new Legend({view});
    this.widget = legend;
  }
}

interface DescriptionParams {
  view: MapView
}