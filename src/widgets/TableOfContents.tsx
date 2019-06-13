import Accessor from "esri/core/Accessor";
import { declared, property, subclass } from "esri/core/accessorSupport/decorators";
import MapView from "esri/views/MapView";
import LayerList from "esri/widgets/LayerList";
import ActionToggle = require('esri/support/actions/ActionToggle');
import GeometryLayer from '../data/GeometryLayer';
import Collection = require('esri/core/Collection');

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
        item.actionsSections = layer.actions
      }
    });
    layerList.on("trigger-action", (event: any) => {
      const item = event.item;
      const action = event.action;
      const id = action.id;
      const actionsSections = item.actionsSections;
      const sectionIndex = getSectionIndex(id, actionsSections);
      // turn off is not allowed
      if (!hasOppositeSectionActiveAction(sectionIndex, actionsSections) || action.value){
        actionsSections.getItemAt(sectionIndex).forEach((section: ActionToggle) => {
          section.value = section.id === id;
        });
      };
      item.layer.rendererFields = getActiveActionIds(actionsSections);
    });
    this.widget = layerList;
  }
}

const getSectionIndex = (id: string, sections: ActionToggle[][]) => {
  return sections.findIndex(section => {
    return !!section.find(action => action.id === id);
   });
}

const hasOppositeSectionActiveAction = (index: number, sections: Collection<Collection<ActionToggle>>) => {
  const oppositeSection = index ? sections.getItemAt(0) : sections.getItemAt(1);
  return oppositeSection && !!oppositeSection.find(action => action.value);
}

const getActiveActionIds = (sections: Collection<Collection<ActionToggle>>) => {
  return sections.reduce((activeActionIds: string[], section) => {
    const activeAction = section.find(action => action.value);
    if(activeAction) activeActionIds.push(activeAction.id);
    return activeActionIds;
  }, [])
}

interface TableOfContentsParams {
  view: MapView
}