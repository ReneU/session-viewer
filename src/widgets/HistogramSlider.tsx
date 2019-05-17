import Accessor from "esri/core/Accessor";
import {clone} from "esri/core/lang";
import d_construct from "dojo/dom-construct";

import { declared, property, subclass } from "esri/core/accessorSupport/decorators";
import MapView from "esri/views/MapView";
import {createContinuousRenderer} from "esri/renderers/smartMapping/creators/color";
import histogram from "esri/renderers/smartMapping/statistics/histogram";
import ColorSlider from "esri/widgets/ColorSlider";

import InteractionLayer from '../data/InteractionLayer';
import appConfig from '../appConfig';

@subclass("app.widgets.HistogramSlider")
export default class HistogramSlider extends declared(Accessor) {

  @property() onWidgetReady: () => void;
  @property()
  set visible(visible: boolean) {
    const container = document.getElementById(this.nodeId + "-container");
    if(container) {
      container.style.visibility = visible ? "visible" : "hidden";
    }
  }
  @property()
  set layer(layer: InteractionLayer) {
    if(layer.id === this.layer.id) return;
    this._set("layer", layer);
    this.updateFieldWatcher(layer);
    this.render();
  }

  private view: MapView;
  private nodeId: string;
  private slider: ColorSlider;
  private fieldWatchHandle: any;

  constructor(params: HistogramSliderParams){
    super();
    const layer = params.layer;
    this._set("layer", layer);
    this.view = params.view;
    this.nodeId = params.nodeId;
    this.render();
    this.updateFieldWatcher(layer);
  }

  private updateFieldWatcher(layer: InteractionLayer) {
    if(this.fieldWatchHandle){
      this.fieldWatchHandle.remove();
    }
    this.fieldWatchHandle = this.layer.watch("rendererField", () => this.render());
  }

  private render(){
    const basemap = appConfig.basemap;
    const theme = "extremes";
    const view = this.view;
    const layer = this.layer;
    const field = layer.rendererField;
    let colorParams = { view, theme, layer, field, basemap };

    layer
      .when(() => createContinuousRenderer(colorParams))
      .then(response => {
        layer.renderer = response.renderer;
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
    const nodeId = this.nodeId;
    this.destroySlider();
    const container = d_construct.create("div", { id: nodeId });
    d_construct.place(container, `${nodeId}-container`);
    sliderParams.container = container;
    const slider = this.slider = new ColorSlider(sliderParams);
    const label = document.getElementById(`${nodeId}-header`);
    if(label){
      label.innerText = layer.rendererField + " (" + theme + ")";
    }
    this.onWidgetReady()

    slider.on("data-change", () => {
      const visualVariable = clone(slider.visualVariable)
      const renderer = clone(layer.renderer);
      renderer.visualVariables = [visualVariable];
      layer.renderer = renderer;
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

const sliderParams: any = {
  numHandles: 3,
  syncedHandles: true
};