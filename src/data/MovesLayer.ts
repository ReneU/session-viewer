import {
    declared,
    subclass
  } from "esri/core/accessorSupport/decorators";
  
import GeometryLayer from "./GeometryLayer";
import Collection from "esri/core/Collection";
import Field from "esri/layers/support/Field";
import Graphic from "esri/Graphic";
  
@subclass()
export default class MovesLayer extends declared(GeometryLayer) {

    rendererFields = ["zoomDiff"];
    static fields = [
        new Field({
            name: "ObjectID",
            alias: "ObjectID",
            type: "oid"
        }),
        new Field ({
            name: "interactionCount",
            alias: "InteractionCount",
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
        [
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
            }
        ]
    ];

    static getConstructorProps (polylineGraphics: Graphic[], id: string, title: string) {
        const source = new Collection();
        source.addMany(polylineGraphics)
        return {
            id,
            title,
            source,
            visible: false,
            fields: MovesLayer.fields,
            objectIdField: "ObjectID"
        }
    }
}