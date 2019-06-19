import {
    declared,
    subclass
  } from "esri/core/accessorSupport/decorators";
  
  import GeometryLayer from "./GeometryLayer";
  import Collection from "esri/core/Collection";
  import Field from "esri/layers/support/Field";
  import Graphic from "esri/Graphic";
import appConfig from '../appConfig';
  
  @subclass("esri.layers.FeatureLayer")
  export default class InteractionsLayer extends declared(GeometryLayer) {
  
    rendererFields = ["zoom"];
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
            alias: "Interaction Count",
            type: "double"
        }),
        new Field ({
            name: "elapsedSessionTime",
            alias: "Elapsed Session-Time",
            type: "double"
        }),
        new Field ({
            name: "totalSessionTime",
            alias: "Total Session-Time",
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
        }),
        new Field ({
            name: "pragmaticQuality",
            alias: "Pragmatic Quality",
            type: "double"
        }),
        new Field ({
            name: "hedonicQuality",
            alias: "Hedonic Quality",
            type: "double"
        }),
        new Field ({
            name: "overallExperience",
            alias: "Overall Experience",
            type: "double"
        })
    ]
    actions = [
        [
            {
                title: appConfig.actions.zoom,
                type: "toggle",
                value: true,
                id: "zoom"
            },
            {
                title: appConfig.actions.interactionCount,
                type: "toggle",
                value: false,
                id: "interactionCount"
            },
            {
                title: appConfig.actions.elapsedSessionTime,
                type: "toggle",
                value: false,
                id: "elapsedSessionTime"
            },
            {
                title: appConfig.actions.totalSessionTime,
                type: "toggle",
                value: false,
                id: "totalSessionTime"
            }
        ],
        [
            {
                title: appConfig.actions.pragmaticQuality,
                type: "toggle",
                value: false,
                id: "pragmaticQuality"
            },
            {
                title: appConfig.actions.hedonicQuality,
                type: "toggle",
                value: false,
                id: "hedonicQuality"
            },
            {
                title: appConfig.actions.overallExperience,
                type: "toggle",
                value: false,
                id: "overallExperience"
            }
        ]
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