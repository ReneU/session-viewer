import ElasticsearchStore from './ElasticsearchStore';
import {ElasticResponse, Session, Event} from "./DataInterfaces";

import SpatialReference from 'esri/geometry/SpatialReference';
import GraphicsLayer from 'esri/layers/GraphicsLayer';
import FeatureLayer from 'esri/layers/FeatureLayer';
import Field from 'esri/layers/support/Field';
import { Point } from 'esri/geometry';
import Graphic from "esri/Graphic";

export default class DataProvider{

    constructor(appIds: string[]){
        appIds.forEach((id: string) => {
            this[id] = ElasticsearchStore.getAggregatedSessions(id);
        });
    }

    getPointCloudLayer(appId: string){
        return this[appId].then((response: ElasticResponse) => {
            return toPointLayer(response);
        });
    }

    getTrajectoriesLayer(appId: string){
        return this[appId].then((response: ElasticResponse) => {
            return toPolylineLayer(response);
        })
    }
}

const toPointLayer = (elasticResponse: ElasticResponse) => {
    const pointGraphics = elasticResponse.sessions.buckets.reduce((graphics: Graphic[], session: Session) => {
        const sessionId = session.key;
        let sessionStartDate: number;
        session.events.hits.hits.forEach((event: Event, i: number) => {
            const eventProps = event._source;
            const sessionTime = sessionStartDate ? eventProps.timestamp - sessionStartDate : 0;
            graphics.push(new Graphic({
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
            if(i === 0){
                sessionStartDate = eventProps.timestamp;
            }
        });
        return graphics;
    }, [])
    return toFeatureLayer(pointGraphics);
}

const toPolylineLayer = (elasticReponse: ElasticResponse) => {
    let trajectories: Polyline[] = [];
    elasticReponse.sessions.buckets.forEach(session => {
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
    const trajectoryGraphics = getGraphics(trajectories);
    const trajectoriesLayer = new GraphicsLayer({ title: 'Trajectories', id: 'trajectories' });
    trajectoriesLayer.addMany(trajectoryGraphics);
    return trajectoriesLayer;
}

const toFeatureLayer = (source: Graphic[]) => {
    return new FeatureLayer({
        title: "Interactions",
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


const getSymbolForFeature = (feature: any) => {
    const width = feature.width || 2;
    const size = feature.size || 1;
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
    
const getGraphics = (features: any) => {
    return features.map((feature: any) => {
        return new Graphic({
        geometry: feature,
        symbol: getSymbolForFeature(feature)
        });
    });
};

interface Polyline {
    type: string,
    paths: number[][]
    spatialReference?: SpatialReference
}