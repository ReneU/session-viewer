import {
    declared,
    property,
    subclass
  } from "esri/core/accessorSupport/decorators";
  
import FeatureLayer from "esri/layers/FeatureLayer";
import Field = require('esri/layers/support/Field');
  
  @subclass()
  export default class GeometryLayer extends declared(FeatureLayer) {
  
    @property()
    rendererFields: string[] = [];
  
    @property()
    actions: Action[][] = [];
  
    @property()
    static fields: Field[] = [];
  }

  interface Action {
      title: string,
      type: string,
      value: boolean,
      id: string
  }