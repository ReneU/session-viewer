import ElasticsearchStore from './ElasticsearchStore';
import {ElasticResponse, Session, Event} from "./DataInterfaces";

import {createContinuousRenderer} from "esri/renderers/smartMapping/creators/color";
import SpatialReference from 'esri/geometry/SpatialReference';
import geometryEngine from "esri/geometry/geometryEngine";
import GraphicsLayer from 'esri/layers/GraphicsLayer';
import FeatureLayer from 'esri/layers/FeatureLayer';
import Field from 'esri/layers/support/Field';
import MapView from 'esri/views/MapView';
import { Point } from 'esri/geometry';
import Graphic from "esri/Graphic";

const CONSTANTS = {
    minRadius: 50,
    maxRadius: 150,
    maxDistance: 3000,
    timeThreshold: 3000
  };

export default class DataProvider{

    constructor(appIds: string[]){
        appIds.forEach((id: string) => {
            this[id] = ElasticsearchStore.getAggregatedSessions(id);
        });
    }

    getInteractionPointsLayer(appId: string){
        return this[appId].then((response: ElasticResponse) => {
            return toInteractionPointsLayer(response);
        });
    }

    getCharacteristicPointsLayer(appId: string, view: MapView) {
        return this[appId].then((response: ElasticResponse) => {
            return toCharacteristicPointsLayer(response, view);
        });
    }

    getSessionTracksLayer(appId: string){
        return this[appId].then((response: ElasticResponse) => {
            return toSessionTracksLayer(response);
        });
    }
}

const toInteractionPointsLayer = (response: ElasticResponse) => {
    const pointGraphics = toPointGraphics(response)
    return toFeatureLayer(pointGraphics, "Interactions");
}

const toCharacteristicPointsLayer = (response: ElasticResponse, view: MapView) => {
    const filter = (evt: Event, idx: number, events: Event[]) => {
        if(idx === 0) return true;
        if(idx === events.length - 1) return false;
        const eventProps = events[idx]._source;
        const nextEventProps = events[idx + 1]._source;
        const timeDelta = nextEventProps.timestamp - eventProps.timestamp;
        return timeDelta >= CONSTANTS.timeThreshold && getDistance(eventProps.map_center, nextEventProps.map_center) < CONSTANTS.maxDistance
    };
    const pointGraphics = toPointGraphics(response, filter);
    const layer = toFeatureLayer(pointGraphics, "Characteristic Points");
    view.when(() => {
        var colorParams = {
            layer,
            view,
            basemap: "dark-gray",
            field: "scale",
            theme: "high-to-low"
          };
          
        createContinuousRenderer(colorParams)
        .then(response => {
            layer.renderer = response.renderer;
        });
    });
    return layer;
}

const toSessionTracksLayer = (response: ElasticResponse) => {
    let trajectories: Polyline[] = [];
    response.sessions.buckets.forEach(session => {
        const events = session.events.hits.hits;
        const track: Polyline = {
            type: 'polyline',
            paths: []
        }
        events.forEach((event: Event) => {
            const eventProps = event._source;
            if (!track.spatialReference) {
                track.spatialReference = new SpatialReference({ wkid: eventProps.map_center.spatialReference.wkid })
            }
            track.paths.push([eventProps.map_center.x, eventProps.map_center.y]);
        });
        trajectories.push(track);
    });
    const trajectoryGraphics = toGraphics(trajectories);
    const graphicsLayer = new GraphicsLayer({ title: 'Trajectories', id: 'trajectories', visible: false });
    graphicsLayer.addMany(trajectoryGraphics);
    return graphicsLayer;
}

function toPointGraphics(response: ElasticResponse, filter?: (evt: Event, idx: number, evts: Event[]) => {}) {
    return response.sessions.buckets.reduce((tempGraphics: Graphic[], session: Session) => {
        const sessionId = session.key;
        let sessionStartDate: number;
        const events = session.events.hits.hits;
        events.forEach((event: Event, i: number) => {
            const eventProps = event._source;
            const sessionTime = sessionStartDate ? eventProps.timestamp - sessionStartDate : 0;
            if (i === 0) {
                sessionStartDate = eventProps.timestamp;
            }
            if(!filter || (filter && filter(event, i, events))){
                tempGraphics.push(new Graphic({
                    attributes: {
                        ObjectID: event._id,
                        sessionId,
                        interactionCount: i,
                        topic: eventProps.message,
                        scale: eventProps.map_scale,
                        zoom: eventProps.map_zoom,
                        sessionTime
                    },
                    geometry: new Point(eventProps.map_center)
                }));
            }
        });
        return tempGraphics;
    }, []);
}

const toFeatureLayer = (source: Graphic[], title: string) => {
    return new FeatureLayer({
        title,
        visible: false,
        source,
        fields: [
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
            new Field ({
                name: "topic",
                alias: "Topic",
                type: "string"
            }),
            new Field ({
                name: "scale",
                alias: "Scale",
                type: "double"
            }),
            new Field ({
                name: "zoom",
                alias: "Zoom",
                type: "double"
            }),
            new Field ({
                name: "interactionCount",
                alias: "InteractionCount",
                type: "double"
            }),
            new Field ({
                name: "sessionTime",
                alias: "SessionTime",
                type: "double"
            })
        ]
    });
}


const getSymbolFromGeometry = (feature: any) => {
    const width = 2;
    const size = 10;
    switch (feature.type) {
        case 'polygon':
        return {
            type: 'simple-fill',
            color: [77, 175, 74, 0.5],
            outline: {
                color: [255, 255, 255],
                width: 1
            }
        };
        case 'point':
        return {
            type: 'simple-marker',
            color: [55, 126, 184],
            size,
            outline: {
                color: [0, 0, 0],
                width: 1
            }
        };
        case 'polyline':
        return {
            type: 'simple-line',
            color: [255, 127, 0],
            width
        };
    }
};
    
const toGraphics = (geometry: any) => {
    return geometry.map((geometry: any) => {
        return new Graphic({
        geometry: geometry,
        attributes: geometry.attributes,
        symbol: getSymbolFromGeometry(geometry)
        });
    });
};

const getDistance = (source: any, destination: any, esriUnit = 'meters') => {
    source = new Point(source);
    destination = new Point(destination);
    return geometryEngine.distance(source, destination, esriUnit);
};

interface Polyline {
    type: string,
    paths: number[][]
    spatialReference?: SpatialReference
}
