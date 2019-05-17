import {
    declared,
    property,
    subclass
  } from "esri/core/accessorSupport/decorators";
  
  import FeatureLayer from "esri/layers/FeatureLayer";
  import Collection from "esri/core/Collection";
  import Field from "esri/layers/support/Field";
  import Graphic from "esri/Graphic";
  
  @subclass()
  export default class InteractionLayer extends declared(FeatureLayer) {
  
    @property()
    rendererField: string = "zoom";
  
    static getPointConstructorProps (graphics: Graphic[], id: string, title: string) {
        const source = new Collection();
        source.addMany(graphics)
        return {
            id,
            title,
            source,
            visible: false,
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
            objectIdField: "ObjectID"
        }
    }
}