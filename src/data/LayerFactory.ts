import {EsResponse, EsSession, EsEvent, SessionEvent, Session, Cluster, Move, Track} from "./DataInterfaces";
import ElasticsearchStore from './ElasticsearchStore';
import FeatureLayer from 'esri/layers/FeatureLayer';
import InteractionsLayer from './InteractionsLayer';
import MovesLayer from './MovesLayer';
import config from "../appConfig";

import SpatialReference from 'esri/geometry/SpatialReference';
import geometryEngine from "esri/geometry/geometryEngine";
import Circle from 'esri/geometry/Circle';
import { Point } from 'esri/geometry';
import Graphic from "esri/Graphic";

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
            legendEnabled: false,
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
            return new InteractionsLayer(InteractionsLayer.getConstructorProps(pointGraphics, id, title));
        });
    }

    createSummarizedMovesLayer(appId: string) {
        return this[appId].then((sessions: Session[]) => {
            const {title, id} = config.movesLayer;
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
            console.log(appId + " - characteristicPoints - " + characteristicPoints.length);
            const clusters = toClusters(characteristicPoints);
            console.log(appId + " - clusters - " + clusters.length);
            const trajectories = toPolylines(sessions);
            const summarizedMoves = toSummarizedMoves(trajectories, clusters);
            console.log(appId + " - summarizedMoves - " + summarizedMoves.length);
            return new MovesLayer(MovesLayer.getConstructorProps(summarizedMoves, id, title));
        });
    }
}

const parseElasticResponse = (response: EsResponse) => {
    return response.sessions.buckets.map((esSession: EsSession) => {
        const events = esSession.events.hits.hits;
        const sessionId = esSession.key;
        let sessionStartDate: number;
        const totalSessionTime = events.reduce((totalTime: number, event: EsEvent, idx: number) => {
            const eventProps = event._source;
            if (!idx) return 0;
            const prevEventProps = events[idx - 1]._source;
            return totalTime + ((eventProps.timestamp - prevEventProps.timestamp) / 1000)
        }, 0);
        const session = {id: sessionId, events: []};
        session.events = events.map((event: EsEvent, idx: number) => {
            const eventProps = event._source;
            if (idx === 0) {
                sessionStartDate = eventProps.timestamp;
            }
            const sessionTime = eventProps.timestamp - sessionStartDate;
            const lastInteractionDelay = !!idx ? sessionTime - (events[idx - 1]._source.timestamp - sessionStartDate) : 0;
            const {message, map_scale, map_zoom,
                supportive, easy, efficient, clear, exciting, interesting, inventive, leadingEdge} = eventProps;
            const pragmaticQuality = (supportive + easy + efficient + clear) / 4;
            const hedonicQuality = (exciting + interesting + inventive + leadingEdge) / 4;
            return {
                attributes: {
                    ObjectID: event._id,
                    sessionId,
                    interactionCount: idx,
                    topic: message,
                    scale: map_scale,
                    zoom: map_zoom,
                    elapsedSessionTime: sessionTime / 1000,
                    lastInteractionDelay,
                    totalSessionTime,
                    pragmaticQuality,
                    hedonicQuality,
                    overallExperience: (pragmaticQuality + hedonicQuality) / 2
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
    let trajectories: Track[] = [];
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
                paths: [[source, destination]],
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
    let clusters: Cluster[] = [];
    let previousSize;
    while (events.length > 0) {
        previousSize = events.length;
        const event = events.shift()!;
        const point = event.geometry;
        let circle = new Circle({
            center: {
                x: point.x,
                y: point.y,
                z: event.attributes.zoom,
                spatialReference: point.spatialReference
            },
            radius: CONSTANTS.minRadius
        });
        let xmin, xmax, ymin, ymax;
        xmin = xmax = point.x;
        ymin = ymax = point.y;
        while (events.length > 0 && events.length < previousSize) {
            previousSize = events.length;
            let pointCandidate;
            for (let i = 0; i < events.length; i++) {
                pointCandidate = events[i].geometry as Point;
                const pointZoom = events[i].attributes.zoom;
                if (isInside(pointCandidate, pointZoom, circle)) {
                    events.splice(i, 1);
                    xmin = Math.min(xmin, pointCandidate.x);
                    xmax = Math.max(xmax, pointCandidate.x);
                    ymin = Math.min(ymin, pointCandidate.y);
                    ymin = Math.max(ymax, pointCandidate.y);
                    circle = extendClusterCircle(circle, xmin, xmax, ymin, ymax, CONSTANTS.minRadius, CONSTANTS.maxRadius);
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

const toSummarizedMoves = (tracks: Track[], clusters: Cluster[]) => {
    const summarizedMoves: Move[] = [];
    tracks.forEach(track => {
        const path = track.paths[0]
        const trackAttr = track.attributes;
        const startPoint = new Point({x: path[0][0], y: path[0][1], spatialReference: track.spatialReference});
        const startCluster = clusters.find(cluster => isInside(startPoint, trackAttr.startZoom, cluster.circle));
        if(!startCluster) return;
        const endPoint = new Point({x: path[1][0], y: path[1][1], spatialReference: track.spatialReference});
        const endCluster = clusters.find(cluster => isInside(endPoint, trackAttr.endZoom, cluster.circle));
        if(!endCluster) return;
        let summarizedMove = summarizedMoves.find(move => isSameCluster(move.start, endCluster) && isSameCluster(startCluster, move.start));
        if(!summarizedMove) {
            summarizedMove = { start: startCluster, end: endCluster, count: 1 };
            summarizedMoves.push(summarizedMove);
        } else {
            summarizedMove.count++;
        }
    });
    return summarizedMoves.map(move => {
        const { start, end, count } = move;
        return new Graphic({
            geometry: {
                type: 'polyline',
                paths: [
                    [start.circle.center.x, start.circle.center.y, start.circle.center.z],
                    [end.circle.center.x, end.circle.center.y, end.circle.center.z]
                ],
                spatialReference: start.circle.center.spatialReference
            },
            attributes: {
                zoomDiff: end.attributes.zoom - start.attributes.zoom,
                scaleDiff: end.attributes.scale - start.attributes.scale,
                interactionCountMoves: count
            },
            symbol: {
                type: 'simple-line',
                color: [255, 127, 0],
                width: count
            }
        });
    })
}

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
    const x = (xmin + xmax) / 2;
    const y = (ymin + ymax) / 2;
    const spatialReference = circle.center.spatialReference;
    const xExtent = getDistance(
        Object.assign({ x, y, spatialReference }, { x: xmax }),
        Object.assign({ x, y, spatialReference }, { x: xmin })
    );
    const yExtent = getDistance(
        Object.assign({ x, y, spatialReference }, { y: ymax }),
        Object.assign({ x, y, spatialReference }, { y: ymin })
    );
    const radius = Math.min(maxRadius, minRadius + (Math.max(xExtent, yExtent) / 2));
    return new Circle({center: {x, y, z: circle.center.z, spatialReference}, radius});
};

const isSameCluster = (first: Cluster, second: Cluster) => {
    const firstCenter = first.circle.center;
    const secondCenter = second.circle.center;
    return firstCenter.x === secondCenter.x &&
        firstCenter.y === secondCenter.y &&
        firstCenter.z === secondCenter.z;
  };