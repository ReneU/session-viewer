import Accessor from "esri/core/Accessor";

import { declared, property, subclass } from "esri/core/accessorSupport/decorators";
import MapView from "esri/views/MapView";
import LayerList from "esri/widgets/LayerList";
import ActionToggle = require('esri/support/actions/ActionToggle');

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
          item.actionsSections = [initialActionSection]
        }
      }
    });
    layerList.on("trigger-action", (event: any) => {
      const item = event.item;
      const id = event.action.id;
      if (item.layer.id === "interaction_points") {
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

const initialActionSection = [
  {
    title: "Zoom Factor",
    type: "toggle",
    value: true,
    id: "zoom"
  },
  {
    title: "Scale",
    type: "toggle",
    value: false,
    id: "scale"
  },
  {
    title: "Interaction Count",
    type: "toggle",
    value: false,
    id: "interactionCount"
  },
  {
    title: "Time since Session-Start",
    type: "toggle",
    value: false,
    id: "sessionTime"
  },
  {
    title: "Time Since Last Interaction",
    type: "toggle",
    value: false,
    id: "lastInteractionDelay"
  }
];