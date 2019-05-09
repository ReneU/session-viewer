import Accessor from "esri/core/Accessor";
import {clone} from "esri/core/lang";

import { declared, property, subclass } from "esri/core/accessorSupport/decorators";
import FeatureLayer from 'esri/layers/FeatureLayer';
import MapView from "esri/views/MapView";
import {createContinuousRenderer} from "esri/renderers/smartMapping/creators/color";
import histogram from "esri/renderers/smartMapping/statistics/histogram";
import ColorSlider from "esri/widgets/ColorSlider";

@subclass("app.widgets.HistogramSlider")
export default class HistogramSlider extends declared(Accessor) {

  @property() layer: FeatureLayer;
  @property() field: string;
  @property() view: MapView;

  constructor(params: HistogramSliderParams){
    super();
    this.layer = params.layer;
    this.field = params.field;
    this.view = params.view;
    this.updateHistogram();
  }

  private updateHistogram(){
    let colorParams = {
      view: this.view,
      layer: this.layer,
      field: this.field,
      basemap: "dark-gray",
      //normalizationField: "TOTPOP_CY",
      theme: "high-to-low"
    };

    let sliderParams: ColorSlider = {
      numHandles: 3,
      syncedHandles: true,
      container: "slider",
    };
    this.layer
      .when(() => createContinuousRenderer(colorParams))
      .then(response => {
        this.layer.renderer = response.renderer;
        sliderParams.statistics = response.statistics;
        sliderParams.visualVariable = response.visualVariable;

        return histogram({
          layer: this.layer,
          field: this.field,
        });
      })
      .then(histogram => {
        sliderParams.histogram = histogram;

        var colorSlider = new ColorSlider(sliderParams);
        this.view.ui.add("slider", "bottom-left");

        colorSlider.on("data-change", () => {
          var renderer = this.layer.renderer.clone();
          renderer.visualVariables = [clone(colorSlider.visualVariable)];
          this.layer.renderer = renderer;
        });
      })
      .catch(function(error) {
        console.log("there was an error: ", error);
      });
  }
}

interface HistogramSliderParams {
  layer: FeatureLayer,
  field: string,
  view: MapView
}