import Accessor from "esri/core/Accessor";
import {clone} from "esri/core/lang";
import d_construct from "dojo/dom-construct";

import { declared, property, subclass } from "esri/core/accessorSupport/decorators";
import MapView from "esri/views/MapView";
import {createContinuousRenderer} from "esri/renderers/smartMapping/creators/color";
import histogram from "esri/renderers/smartMapping/statistics/histogram";
import ColorSlider from "esri/widgets/ColorSlider";
import { Renderer } from 'esri/renderers';

import InteractionLayer from '../data/InteractionLayer';

@subclass("app.widgets.HistogramSlider")
export default class HistogramSlider extends declared(Accessor) {

  private layer: InteractionLayer;
  private view: MapView;
  private nodeId: string;
  private slider: ColorSlider;
  @property()
  set visible(value: boolean) {
    const container = document.getElementById(this.nodeId + "-container");
    if(container) {
      container.style.visibility = value ? "visible" : "hidden";
    }
  }
  get visible(): boolean {
    return true;
  }
  @property() onRendererChange: (renderer: Renderer) => void;
  @property() onWidgetReady: () => void;

  constructor(params: HistogramSliderParams){
    super();
    this.layer = params.layer;
    this.view = params.view;
    this.nodeId = params.nodeId;
    this.updateHistogram();
    this.layer.watch("rendererField", () => this.updateHistogram());
  }

  private updateHistogram(){
    const theme = "extremes";
    const view = this.view;
    const layer = this.layer;
    const field = layer.rendererField;
    let colorParams = {
      view,
      layer,
      field,
      basemap: "dark-gray",
      theme
    };

    let sliderParams: any = {
      numHandles: 3,
      syncedHandles: true
    };

    this.layer
      .when(() => createContinuousRenderer(colorParams))
      .then(response => {
        this.onRendererChange(response.renderer);
        sliderParams.statistics = response.statistics;
        sliderParams.visualVariable = response.visualVariable;

        return histogram({layer, field});
      })
      .then(histogram => {
        sliderParams.histogram = histogram;

        this.updateSlider(sliderParams, theme);
      })
      .catch(function(error) {
        console.log("there was an error: ", error);
      });
  }

  private updateSlider(sliderParams: any, theme: string){
    const layer = this.layer;
    this.destroySlider();
    const container = d_construct.create("div", { id: this.nodeId });
    d_construct.place(container, `${this.nodeId}-container`);
    sliderParams.container = container;
    const slider = this.slider = new ColorSlider(sliderParams);
    const label = document.getElementById(`${this.nodeId}-header`);
    if(label){
      label.innerText = layer.rendererField + " (" + theme + ")";
    }
    this.onWidgetReady()

    slider.on("data-change", () => {
      const visualVariable = clone(slider.visualVariable)
      const renderer = clone(layer.renderer);
      renderer.visualVariables = [visualVariable];
      this.onRendererChange(renderer);
    });
  }

  private destroySlider(){
    const slider = this.slider;
    if(slider){
      slider.destroy();
    }
  }
}

interface HistogramSliderParams {
  layer: InteractionLayer,
  view: MapView
  nodeId: string,
}