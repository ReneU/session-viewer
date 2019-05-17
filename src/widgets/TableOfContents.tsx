import Accessor from "esri/core/Accessor";

import { declared, property, subclass } from "esri/core/accessorSupport/decorators";
import MapView from "esri/views/MapView";
import LayerList from "esri/widgets/LayerList";

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
        if(item.layer.id === "interaction_points") {
          item.actionsSections = [[
            {
              title: "Scale",
              type: "toggle",
              value: true,
              id: "scale"
            },
            {
              title: "Time since Session-Start",
              type: "toggle",
              value: false,
              id: "timeSinceSessionStart"
            }
          ]]
        }
      }
    });
    layerList.on("trigger-action", (event: any) => {
      const item = event.item;
      const id = event.action.id;
      if (item.layer.id === "interaction_points") {
        item.actionsSections.getItemAt(0).forEach(section => {
          section.value = section.id === id;
        });
        // do something
      }
    });
    this.widget = layerList;
  }
}

interface TableOfContentsParams {
  view: MapView
}