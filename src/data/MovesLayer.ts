import { declared, subclass } from "esri/core/accessorSupport/decorators";

import GeometryLayer from "./GeometryLayer";
import Collection from "esri/core/Collection";
import Field from "esri/layers/support/Field";
import Graphic from "esri/Graphic";
import appConfig from "../appConfig";

@subclass()
export default class MovesLayer extends declared(GeometryLayer) {
  rendererFields = ["zoomDiff"];
  static fields = [
    new Field({
      name: "ObjectID",
      alias: "ObjectID",
      type: "oid"
    }),
    new Field({
      name: "interactionCountMoves",
      alias: appConfig.fields.interactionCountMoves,
      type: "double"
    }),
    new Field({
      name: "scaleDiff",
      alias: "Scale Difference",
      type: "double"
    }),
    new Field({
      name: "zoomDiff",
      alias: appConfig.fields.zoomDiff,
      type: "double"
    })
  ];
  actions = [
    [
      {
        title: appConfig.fields.zoomDiff,
        type: "toggle",
        value: true,
        id: "zoomDiff"
      },
      {
        title: appConfig.fields.interactionCountMoves,
        type: "toggle",
        value: false,
        id: "interactionCountMoves"
      }
    ]
  ];

  static getConstructorProps(
    polylineGraphics: Graphic[],
    id: string,
    title: string
  ) {
    const source = new Collection();
    source.addMany(polylineGraphics);
    return {
      id,
      title,
      source,
      visible: false,
      fields: MovesLayer.fields,
      objectIdField: "ObjectID"
    };
  }
}
