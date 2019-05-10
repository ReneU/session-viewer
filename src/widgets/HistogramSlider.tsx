import Accessor from "esri/core/Accessor";
import {clone} from "esri/core/lang";

import { declared, property, subclass } from "esri/core/accessorSupport/decorators";
import FeatureLayer from 'esri/layers/FeatureLayer';
import MapView from "esri/views/MapView";
import {createContinuousRenderer} from "esri/renderers/smartMapping/creators/color";
import histogram from "esri/renderers/smartMapping/statistics/histogram";
import ColorSlider from "esri/widgets/ColorSlider";
import { Renderer } from 'esri/renderers';

@subclass("app.widgets.HistogramSlider")
export default class HistogramSlider extends declared(Accessor) {

  @property() layer: FeatureLayer;
  @property() field: string;
  @property() view: MapView;
  @property() onRendererChange: (renderer: Renderer) => void;
  @property() onWidgetReady: () => void;

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
      maxValue: 50000,
      theme: "extremes",
      legendOptions: {
        title: "Scale Extremes"
      }
    };

    let sliderParams: any = {
      numHandles: 3,
      syncedHandles: true,
      container: "slider",
    };
    this.layer
      .when(() => createContinuousRenderer(colorParams))
      .then(response => {
        this.onRendererChange(response.renderer);
        sliderParams.statistics = response.statistics;
        sliderParams.visualVariable = response.visualVariable;

        return histogram({
          layer: this.layer,
          field: this.field,
        });
      })
      .then(histogram => {
        sliderParams.histogram = histogram;

        const colorSlider = new ColorSlider(sliderParams);
        this.onWidgetReady()

        colorSlider.on("data-change", () => {
          const visualVariable = clone(colorSlider.visualVariable)
          const renderer = clone(this.layer.renderer);
          renderer.visualVariables = [visualVariable];
          this.onRendererChange(renderer);
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