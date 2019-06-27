import { declared, subclass } from "esri/core/accessorSupport/decorators";

import GeometryLayer from "./GeometryLayer";
import Collection from "esri/core/Collection";
import Field from "esri/layers/support/Field";
import Graphic from "esri/Graphic";
import appConfig from "../appConfig";

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
    new Field({
      name: "topic",
      alias: "Topic",
      type: "string"
    }),
    new Field({
      name: "interactionCount",
      alias: appConfig.fields.interactionCount,
      type: "double"
    }),
    new Field({
      name: "elapsedSessionTime",
      alias: appConfig.fields.elapsedSessionTime,
      type: "double"
    }),
    new Field({
      name: "totalSessionTime",
      alias: "Total Session-Time",
      type: "double"
    }),
    new Field({
      name: "scale",
      alias: "Scale",
      type: "double"
    }),
    new Field({
      name: "zoom",
      alias: appConfig.fields.zoom,
      type: "double"
    }),
    new Field({
      name: "pragmaticQuality",
      alias: appConfig.fields.pragmaticQuality,
      type: "double"
    }),
    new Field({
      name: "hedonicQuality",
      alias: appConfig.fields.hedonicQuality,
      type: "double"
    }),
    new Field({
      name: "overallExperience",
      alias: appConfig.fields.overallExperience,
      type: "double"
    })
  ];
  actions = [
    [
      {
        title: appConfig.fields.zoom,
        type: "toggle",
        value: true,
        id: "zoom"
      },
      {
        title: appConfig.fields.interactionCount,
        type: "toggle",
        value: false,
        id: "interactionCount"
      },
      {
        title: appConfig.fields.elapsedSessionTime,
        type: "toggle",
        value: false,
        id: "elapsedSessionTime"
      }
    ],
    [
      {
        title: appConfig.fields.pragmaticQuality,
        type: "toggle",
        value: false,
        id: "pragmaticQuality"
      },
      {
        title: appConfig.fields.hedonicQuality,
        type: "toggle",
        value: false,
        id: "hedonicQuality"
      },
      {
        title: appConfig.fields.overallExperience,
        type: "toggle",
        value: false,
        id: "overallExperience"
      }
    ]
  ];

  static getConstructorProps(
    pointGraphics: Graphic[],
    id: string,
    title: string
  ) {
    const source = new Collection();
    source.addMany(pointGraphics);
    return {
      id,
      title,
      source,
      visible: false,
      fields: InteractionsLayer.fields,
      objectIdField: "ObjectID"
    };
  }
}
