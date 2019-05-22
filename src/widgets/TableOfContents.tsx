import Accessor from "esri/core/Accessor";
import { declared, property, subclass } from "esri/core/accessorSupport/decorators";
import MapView from "esri/views/MapView";
import LayerList from "esri/widgets/LayerList";
import ActionToggle = require('esri/support/actions/ActionToggle');
import GeometryLayer from '../data/GeometryLayer';

@subclass("app.widgets.TableOfContents")
export default class TableOfContents extends declared(Accessor) {

  @property() widget: LayerList;

  constructor(params: TableOfContentsParams){
    super();
    this.createLayerList(params.view);
  }

  getWidget(){
    return this.widget;
  }

  private createLayerList(view: MapView){
    const layerList = new LayerList({
      view,
      listItemCreatedFunction: event => {
        const item = event.item;
        const layer = item.layer;
        if(!(layer instanceof GeometryLayer)) return;
        item.actionsSections = [layer.actions]
      }
    });
    layerList.on("trigger-action", (event: any) => {
      const item = event.item;
      const id = event.action.id;
      if (item.layer instanceof GeometryLayer) {
        item.actionsSections.getItemAt(0).forEach((section: ActionToggle) => {
          section.value = section.id === id;
        });
        item.layer.rendererField = id;
      }
    });
    this.widget = layerList;
  }
}

interface TableOfContentsParams {
  view: MapView
}