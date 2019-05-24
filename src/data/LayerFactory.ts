import {EsResponse, EsSession, EsEvent, SessionEvent, Session} from "./DataInterfaces";
import ElasticsearchStore from './ElasticsearchStore';
import FeatureLayer from 'esri/layers/FeatureLayer';
import PolylineLayer from './PolylineLayer';
import PointLayer from './PointLayer';
import config from "../appConfig";

import SpatialReference from 'esri/geometry/SpatialReference';
import geometryEngine from "esri/geometry/geometryEngine";
import { Point } from 'esri/geometry';
import Graphic from "esri/Graphic";
import Circle from 'esri/geometry/Circle';
import Polyline from 'esri/geometry/Polyline';
import GraphicsLayer from 'esri/layers/GraphicsLayer';

const CONSTANTS = {
    minRadius: 1000,
    maxRadius: 2000,
    maxDistance: 3000,
    timeThreshold: 3000
  };

export default class LayerFactory {

    constructor(appIds: string[]){
        appIds.forEach((id: string) => {
            this[id] = ElasticsearchStore.getAggregatedSessions(id)
                .then(parseElasticResponse);
        });
    }

    static createTaskGeometriesLayer() {
        return new FeatureLayer({
            url: config.taskGeometriesLayer.url,
            title: config.taskGeometriesLayer.title,
            id: config.taskGeometriesLayer.id,
            renderer: {
                type: "simple",
                symbol: {
                  type: "simple-marker",
                  size: 12,
                  color: [255, 100, 46],
                  outline: {
                    width: 0,
                    color: [255, 100, 46]
                  }
                }
              }
          });
    }

    createInteractionPointsLayer(appId: string){
        return this[appId].then((sessions: Session[]) => {
            const {title, id} = config.interactionLayer;
            const pointGraphics = toPointGraphics(sessions);
            return new PointLayer(PointLayer.getConstructorProps(pointGraphics, id, title));
        });
    }

    createCharacteristicPointsLayer(appId: string) {
        return this[appId].then((sessions: Session[]) => {
            const {title, id} = config.characteristicsLayer;
            const pointGraphics = toPointGraphics(sessions, characteristicsFilter);
            return new PointLayer(PointLayer.getConstructorProps(pointGraphics, id ,title));
        });
    }

    createSummarizedMovesLayer(appId: string) {
        return this[appId].then((sessions: Session[]) => {
            const {title, id} = config.clusterLayer;
            const characteristicPoints = sessions.reduce((tempEvents: SessionEvent[], session: Session) => {
                const events = session.events;
                const filteredSessionEvents = events.filter((event: SessionEvent, idx: number) => {
                    if(idx === 0) return true;
                    if(idx === events.length - 1) return false;
                    const eventAttr = event.attributes;
                    const nextEvent = events[idx + 1];
                    return eventAttr.lastInteractionDelay >= CONSTANTS.timeThreshold && getDistance(event.geometry, nextEvent.geometry) < CONSTANTS.maxDistance;
                });
                return tempEvents.concat(filteredSessionEvents);
            }, []);
            console.log(characteristicPoints.length);
            const clusters = toClusters(characteristicPoints);
            console.log(clusters.length);
            const trajectories = toPolylines(sessions);
            const summarizedMoves = toSummarizedMoves(trajectories, clusters);
            const clusterLayer = new GraphicsLayer({ title, id, visible: false });
            clusterLayer.addMany(summarizedMoves);
            return clusterLayer
        });
    }

    createSessionTracksLayer(appId: string){
        return this[appId].then((sessions: Session[]) => {
            const trajectories = toPolylines(sessions);
            const {title, id} = config.trajectoriesLayer;
            const polylineGraphics = toGraphics(trajectories);
            return new PolylineLayer(PolylineLayer.getConstructorProps(polylineGraphics, id, title));
        });
    }
}

const parseElasticResponse = (response: EsResponse) => {
    return response.sessions.buckets.map((esSession: EsSession) => {
        const events = esSession.events.hits.hits;
        const sessionId = esSession.key;
        let sessionStartDate: number;
        const totalSessionTime = events.reduce((totalTime: number, event: EsEvent) => {
            const eventProps = event._source;
            if (!sessionStartDate) {
                sessionStartDate = eventProps.timestamp;
            }
            return (eventProps.timestamp - sessionStartDate) / 1000 + totalTime;
        }, 0);
        const session = {id: sessionId, events: []};
        session.events = events.map((event: EsEvent, idx: number) => {
            const eventProps = event._source;
            if (idx === 0) {
                sessionStartDate = eventProps.timestamp;
            }
            const sessionTime = eventProps.timestamp - sessionStartDate;
            const lastInteractionDelay = !!idx ? sessionTime - (events[idx - 1]._source.timestamp - sessionStartDate) : 0;
            return {
                attributes: {
                    ObjectID: event._id,
                    sessionId,
                    interactionCount: idx,
                    topic: eventProps.message,
                    scale: eventProps.map_scale,
                    zoom: eventProps.map_zoom,
                    elapsedSessionTime: sessionTime / 1000,
                    lastInteractionDelay,
                    totalSessionTime
                },
                geometry: eventProps.map_center
            } as SessionEvent;
        });
        return session;
    });
};

function toPointGraphics(sessions: Session[], filter?: (evt: SessionEvent, idx: number, evts: SessionEvent[]) => {}) {
    return sessions.reduce((tempGraphics: Graphic[], session: Session) => {
        session.events.forEach((event: SessionEvent, idx: number) => {
            if(!filter || (filter && filter(event, idx, session.events))){
                tempGraphics.push(new Graphic({
                    attributes: event.attributes,
                    geometry: new Point(event.geometry)
                }));
            }
        });
        return tempGraphics;
    }, []);
}

const toPolylines = (sessions: Session[]) => {
    let trajectories: Polyline[] = [];
    sessions.forEach((session: Session) => {
        session.events.forEach((event: SessionEvent, idx: number) => {
            if (idx === 0) return;
            const prevEvent = session.events[idx - 1];
            const prevEventAttr = prevEvent.attributes;
            const prevEventGeom = prevEvent.geometry;
            const source = [prevEventGeom.x, prevEventGeom.y];
            const destination = [event.geometry.x, event.geometry.y];
            const eventAttr = event.attributes;
            trajectories.push({
                type: 'polyline',
                paths: [source, destination],
                spatialReference: new SpatialReference({ wkid: event.geometry.spatialReference.wkid }),
                attributes: {
                    topic: eventAttr.topic,
                    ObjectID: eventAttr.ObjectID,
                    sessionId: eventAttr.sessionId,
                    interactionCount: eventAttr.interactionCount,
                    startZoom: prevEventAttr.zoom,
                    endZoom: eventAttr.zoom,
                    zoomDiff: eventAttr.zoom - prevEventAttr.zoom,
                    elapsedSessionTime: eventAttr.elapsedSessionTime,
                    startScale: prevEventAttr.scale,
                    endScale: eventAttr.scale,
                    scaleDiff: eventAttr.scale - prevEventAttr.scale,
                    lastInteractionDelay: eventAttr.lastInteractionDelay,
                    totalSessionTime: eventAttr.totalSessionTime
                },
            });
        });
    });
    return trajectories;
}

const toClusters = (events: SessionEvent[]) => {
    let clusters = [];
    let previousSize;
    while (events.length > 0) {
        previousSize = events.length;
        const event = events.shift()!;
        const point = event.geometry;
        const circle = { center: point, radius: CONSTANTS.minRadius };
        circle.center.z = event.attributes.zoom;
        let xmin, xmax, ymin, ymax;
        xmin = xmax = point.x;
        ymin = ymax = point.y;
        while (events.length > 0 && events.length < previousSize) {
            previousSize = events.length;
            let pointCandidate;
            for (let i = 0; i < events.length; i++) {
                pointCandidate = events[i].geometry as Point;
                const pointZoom = events[i].attributes.zoom;
                if (isInside(pointCandidate, pointZoom, new Circle(circle))) {
                    events.splice(i, 1);
                    xmin = Math.min(xmin, pointCandidate.x);
                    xmax = Math.max(xmax, pointCandidate.x);
                    ymin = Math.min(ymin, pointCandidate.y);
                    ymin = Math.max(ymax, pointCandidate.y);
                    extendClusterCircle(circle, xmin, xmax, ymin, ymax, CONSTANTS.minRadius, CONSTANTS.maxRadius);
                }
            }
        }
        clusters.push({
            circle,
            attributes: {
                scale: event.attributes.scale,
                zoom: event.attributes.zoom
            }
        });
    }
    return clusters;
}

const toSummarizedMoves = (trajectories: Polyline[], clusters: any[]) => {
    const summarizedMoves = [];
    trajectories.forEach(track => {
        if(track.paths.length < 3) return;
        const spatialReference = track.spatialReference;
        let i = 1;
        const startingNode = track.paths[0];
        const startingPoint = new Point({ x: startingNode[0], y: startingNode[1], z: startingNode[2], spatialReference });
        let startCluster = clusters.find(cluster => isInside(startingPoint, cluster));
        for (let k = 1; k < track.paths.length; k++) {
            const node = track.paths[k];
            const point = new Point({ x: node[0], y: node[1], z: node[2], spatialReference });
            if (!isInside(point, startCluster)) {
                const cluster = clusters.find(cluster => isInside(point, cluster));
                if (cluster) {
                    let summarizedMove = summarizedMoves.find(move => {
                        return isSameCircle(move.start, startCluster) && isSameCircle(move.end, cluster);
                    });
                    if (!summarizedMove) {
                        summarizedMove = { start: startCluster, end: cluster, moves: [] };
                        summarizedMoves.push(summarizedMove);
                    }
                    summarizedMove.moves.push([track.paths[i], track.paths[k]]);
                    startCluster = cluster;
                    i = k;
                }
            } else {
                i++;
            }
        }
    });
    return summarizedMoves.map(move => {
        return {
        type: 'polyline',
        width: move.moves.length,
        paths: [
            [move.start.center.x, move.start.center.y, move.start.center.z],
            [move.end.center.x, move.end.center.y, move.end.center.z]
        ],
        spatialReference: { wkid: 4326 }
        };
    });
}

const characteristicsFilter =  (event: SessionEvent, idx: number, events: SessionEvent[]) => {
    if(idx === 0) return true;
    if(idx === events.length - 1) return false;
    const eventAttr = event.attributes;
    const nextEvent = events[idx + 1];
    return eventAttr.lastInteractionDelay >= CONSTANTS.timeThreshold && getDistance(event.geometry, nextEvent.geometry) < CONSTANTS.maxDistance;
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

const isInside = (point: Point, pointZ: number, circle: Circle) => {
    if (Math.trunc(pointZ) !== Math.trunc(circle.center.z)) {
        return false;
    }
    return geometryEngine.contains(circle, point);
  };

const extendClusterCircle = (circle: any, xmin: number, xmax: number, ymin: number, ymax: number, minRadius: number, maxRadius: number) => {
    circle.center.x = (xmin + xmax) / 2;
    circle.center.y = (ymin + ymax) / 2;
    const { x, y, spatialReference } = circle.center;
    const xExtent = getDistance(
        Object.assign({ x, y, spatialReference }, { x: xmax }),
        Object.assign({ x, y, spatialReference }, { x: xmin })
    );
    const yExtent = getDistance(
        Object.assign({ x, y, spatialReference }, { y: ymax }),
        Object.assign({ x, y, spatialReference }, { y: ymin })
    );
    circle.radius = Math.min(maxRadius, minRadius + (Math.max(xExtent, yExtent) / 2));
};