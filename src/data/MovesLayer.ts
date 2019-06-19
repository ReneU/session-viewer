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
      name: "interactionCount",
      alias: "Interaction Count",
      type: "double"
    }),
    new Field({
      name: "scaleDiff",
      alias: "Scale Difference",
      type: "double"
    }),
    new Field({
      name: "zoomDiff",
      alias: "Zoom Difference",
      type: "double"
    })
  ];
  actions = [
    [
      {
        title: appConfig.actions.zoomDiff,
        type: "toggle",
        value: true,
        id: "zoomDiff"
      },
      {
        title: appConfig.actions.interactionCountMoves,
        type: "toggle",
        value: false,
        id: "interactionCount"
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
