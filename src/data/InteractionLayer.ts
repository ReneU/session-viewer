import {
    declared,
    property,
    subclass
  } from "esri/core/accessorSupport/decorators";
  import config from "../appConfig";
  
  import Collection from "esri/core/Collection";
  import Graphic from "esri/Graphic";
  import FeatureLayer from "esri/layers/FeatureLayer";
  import Field from "esri/layers/support/Field";
  
  @subclass()
  export default class InteractionLayer extends declared(FeatureLayer) {
  
    @property()
    rendererField: string = "zoom";
  
    static getConstructorProperties (graphics: Graphic[]) {
        const source = new Collection();
        source.addMany(graphics)
        return {
            title: config.interactionLayer.title,
            id: config.interactionLayer.id,
            visible: false,
            source,
            fields: [
                new Field({
                    name: "ObjectID",
                    alias: "ObjectID",
                    type: "oid"
                }),
                new Field({
                    name: "sessionId",
                    alias: "SessionID",
                    type: "string"
                }),
                new Field ({
                    name: "topic",
                    alias: "Topic",
                    type: "string"
                }),
                new Field ({
                    name: "scale",
                    alias: "Scale",
                    type: "double"
                }),
                new Field ({
                    name: "zoom",
                    alias: "Zoom",
                    type: "double"
                }),
                new Field ({
                    name: "interactionCount",
                    alias: "InteractionCount",
                    type: "double"
                }),
                new Field ({
                    name: "lastInteractionDelay",
                    alias: "LastInteractionDelay",
                    type: "double"
                }),
                new Field ({
                    name: "sessionTime",
                    alias: "SessionTime",
                    type: "double"
                })
            ],
            objectIdField: "ObjectID",
            geometryType: "point"
        }
    }
}