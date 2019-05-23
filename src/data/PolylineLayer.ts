import {
    declared,
    subclass
  } from "esri/core/accessorSupport/decorators";
  
  import GeometryLayer from "./GeometryLayer";
  import Collection from "esri/core/Collection";
  import Field from "esri/layers/support/Field";
  import Graphic from "esri/Graphic";
  
  @subclass()
  export default class PoylineLayer extends declared(GeometryLayer) {
  
    rendererField = "zoomDiff";
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
            name: "lastInteractionDelay",
            alias: "LastInteractionDelay",
            type: "double"
        }),
        new Field ({
            name: "elapsedSessionTime",
            alias: "elapsedSessionTime",
            type: "double"
        }),
        new Field ({
            name: "totalSessionTime",
            alias: "totalSessionTime",
            type: "double"
        }),
        new Field ({
            name: "scaleDiff",
            alias: "ScaleDifference",
            type: "double"
        }),
        new Field ({
            name: "zoomDiff",
            alias: "Zoom",
            type: "double"
        })
    ]
    actions = [
        {
            title: "Zoom Difference",
            type: "toggle",
            value: true,
            id: "zoomDiff"
        },
        {
            title: "Scale Difference",
            type: "toggle",
            value: false,
            id: "scaleDiff"
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
        },
        {
            title: "Time since last Interaction (s)",
            type: "toggle",
            value: false,
            id: "lastInteractionDelay"
        }
        ];

    static getConstructorProps (polylineGraphics: Graphic[], id: string, title: string) {
        const source = new Collection();
        source.addMany(polylineGraphics)
        return {
            id,
            title,
            source,
            visible: false,
            fields: PoylineLayer.fields,
            objectIdField: "ObjectID"
        }
    }
}