import Accessor from "esri/core/Accessor";
import {clone} from "esri/core/lang";
import d_construct from "dojo/dom-construct";

import { declared, property, subclass } from "esri/core/accessorSupport/decorators";
import {createContinuousRenderer} from "esri/renderers/smartMapping/creators/color";
import histogram from "esri/renderers/smartMapping/statistics/histogram";
import ColorSlider from "esri/widgets/ColorSlider";
import MapView from "esri/views/MapView";

import GeometryLayer from '../data/GeometryLayer';
import appConfig from '../appConfig';

@subclass("app.widgets.HistogramSlider")
export default class HistogramSlider extends declared(Accessor) {

  @property() visible: boolean = false;

  @property()
  set layer(layer: GeometryLayer) {
    if(layer && this.layer && layer.id === this.layer.id) return;
    this._set("layer", layer);
    if(this.fieldWatchHandle){
      this.fieldWatchHandle.remove();
    }
    this.updateVisibility();
    if(!layer) return;
    this.render();
    this.fieldWatchHandle = layer.watch("rendererFields", () => {
      this.updateVisibility();
      this.render();
    });
  }

  @property({value: "high-to-low"})
  set theme(theme: string) {
    if(theme === this.theme) return;
    this._set("theme", theme);
    this.selectNode.value = theme;
    this.render();
  }

  private view: MapView;
  private nodeId: string;
  private slider: ColorSlider;
  private fieldWatchHandle: any;
  private selectNode: HTMLSelectElement;

  constructor(params: HistogramSliderParams){
    super();
    this.view = params.view;
    this.nodeId = params.nodeId;
    const selectElement = this.selectNode = document.getElementById(params.nodeId + "-select")! as HTMLSelectElement;
    this.theme = selectElement.value;
    selectElement.onchange = () => {
      this.theme = selectElement.value;
    };
    setI18nValues(params.nodeId + "-select");
  }

  private render(){
    if(!this.visible) return;
    const view = this.view;
    const theme = this.theme;
    const layer = this.layer;
    const field = layer.rendererFields[0];
    const basemap = appConfig.basemap;
    let colorParams = { view, theme, layer, field, basemap };
    const minValue = sliderParams.minValue = appConfig.slider[field].minValue;
    const maxValue = sliderParams.maxValue = appConfig.slider[field].maxValue;
    const numBins = appConfig.slider[field].numBins;

    layer
      .when(() => createContinuousRenderer(colorParams))
      .then(response => {
        layer.renderer = response.renderer;
        sliderParams.statistics = response.statistics;
        sliderParams.visualVariable = response.visualVariable;

        return histogram({layer, field, minValue, maxValue, numBins});
      })
      .then(histogram => {
        sliderParams.histogram = histogram;
        this.updateSlider(sliderParams);
      })
      .catch(function(error) {
        console.log("there was an error: ", error);
      });
  }

  private updateSlider(sliderParams: any){
    const layer = this.layer;
    const nodeId = this.nodeId;
    this.destroySlider();
    sliderParams.container = this.getSliderNode(nodeId);
    document.getElementById(`${nodeId}-container`)!.style.display = "block"
    const slider = this.slider = new ColorSlider(sliderParams);
    const label = document.getElementById(`${nodeId}-header`);
    if(label){
      label.innerText = layer.fields.find(field => field.name === layer.rendererFields[0])!.alias;
    }

    slider.on("data-change", () => {
      const visualVariable = clone(slider.visualVariable)
      const renderer = clone(layer.renderer);
      renderer.visualVariables = [visualVariable];
      layer.renderer = renderer;
    });
  }

  private getSliderNode(nodeId: string) {
    let node = document.getElementById(nodeId)!;
    if (node) return node;
    node = d_construct.create("div", { id: nodeId });
    d_construct.place(node, `${nodeId}-container`);
    return node;
  }

  private destroySlider(){
    const slider = this.slider;
    if(slider){
      slider.destroy();
    }
  }

  private updateVisibility(){
    const layer = this.layer;
    this.visible = layer && layer.rendererFields.length === 1;
  }
}

const setI18nValues = (nodeId: string) => {
  const selectNode = document.getElementById(nodeId)! as HTMLSelectElement;
  Array.prototype.slice.apply(selectNode.children).forEach((optionNode: HTMLOptionElement) => optionNode.innerText = appConfig.slider[optionNode.value]);

}

interface HistogramSliderParams {
  view: MapView
  nodeId: string,
}

const sliderParams: any = {
  numHandles: 3,
  syncedHandles: true
};