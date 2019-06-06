import {
    declared,
    subclass
  } from "esri/core/accessorSupport/decorators";
  
  import GeometryLayer from "./GeometryLayer";
  import Collection from "esri/core/Collection";
  import Field from "esri/layers/support/Field";
  import Graphic from "esri/Graphic";
  
  @subclass()
  export default class InteractionsLayer extends declared(GeometryLayer) {
  
    rendererField = "zoom";
    static fields = [
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
            name: "interactionCount",
            alias: "InteractionCount",
            type: "double"
        }),
        new Field ({
            name: "elapsedSessionTime",
            alias: "ElapsedSessionTime",
            type: "double"
        }),
        new Field ({
            name: "totalSessionTime",
            alias: "TotalSessionTime",
            type: "double"
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
        })
    ]
    actions = [
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
            title: "Time since Session-Start (s)",
            type: "toggle",
            value: false,
            id: "elapsedSessionTime"
        },
        {
            title: "Total Session-Time (s)",
            type: "toggle",
            value: false,
            id: "totalSessionTime"
        }
        ];

    static getConstructorProps (pointGraphics: Graphic[], id: string, title: string) {
        const source = new Collection();
        source.addMany(pointGraphics)
        return {
            id,
            title,
            source,
            visible: false,
            fields: InteractionsLayer.fields,
            objectIdField: "ObjectID"
        }
    }
}